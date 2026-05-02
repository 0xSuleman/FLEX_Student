package com.nuked.portal.service;

import com.nuked.portal.dto.GradeListDTO;
import com.nuked.portal.dto.GradeRowDTO;
import com.nuked.portal.model.*;
import com.nuked.portal.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GradeSubmissionService {

    private final FacultyService facultyService;
    private final FacultySectionRepository facultySectionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final MarksInstrumentRepository instrumentRepository;
    private final MarksRepository marksRepository;
    private final GradeSubmissionRepository gradeSubmissionRepository;

    /**
     * Compute the grade list for a section: weighted % per student, letter
     * grade per the section's scheme, distribution counts, and class mean.
     * The faculty version checks ownership; the HOD version (below) does not.
     */
    @Transactional
    public GradeListDTO previewForFaculty(String username, Long sectionId) {
        FacultySection fs = facultyService.ownedSection(username, sectionId);
        return buildGradeList(fs);
    }

    @Transactional
    public GradeListDTO previewForHod(Long submissionId) {
        GradeSubmission gs = gradeSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown submission " + submissionId));
        FacultySection fs = facultySectionRepository.findById(gs.getFacultySection().getId())
                .orElseThrow(() -> new IllegalArgumentException("Section missing for submission"));
        return buildGradeList(fs);
    }

    @Transactional
    public GradeListDTO submit(String username, Long sectionId) {
        FacultySection fs = facultyService.ownedSection(username, sectionId);
        GradeListDTO preview = buildGradeList(fs);
        if (!preview.isReadyToSubmit()) {
            throw new IllegalStateException(
                    "Cannot submit — " + String.join("; ", preview.getBlockers()));
        }
        GradeSubmission gs = gradeSubmissionRepository.findByFacultySectionId(fs.getId())
                .orElseGet(() -> {
                    GradeSubmission g = new GradeSubmission();
                    g.setFacultySection(fs);
                    return g;
                });
        if (gs.getState() == GradeSubmission.State.SUBMITTED ||
            gs.getState() == GradeSubmission.State.APPROVED) {
            throw new IllegalStateException("Already " + gs.getState());
        }
        gs.setState(GradeSubmission.State.SUBMITTED);
        gs.setSubmittedAt(LocalDateTime.now());
        gs.setHodRemarks(null);
        gradeSubmissionRepository.save(gs);
        return buildGradeList(fs);
    }

    /** HOD-side: list everything currently awaiting decision. */
    @Transactional
    public List<GradeListDTO> pendingForHod() {
        return gradeSubmissionRepository
                .findByStateOrderBySubmittedAtAsc(GradeSubmission.State.SUBMITTED)
                .stream()
                .map(gs -> buildGradeList(gs.getFacultySection()))
                .toList();
    }

    @Transactional
    public GradeListDTO approve(Long submissionId, String remarks) {
        GradeSubmission gs = mustBeSubmitted(submissionId);
        gs.setState(GradeSubmission.State.APPROVED);
        gs.setDecidedAt(LocalDateTime.now());
        gs.setHodRemarks(remarks);
        gradeSubmissionRepository.save(gs);

        // Per req 3.4.5 + 5.2.3: flip FINAL instruments to PUBLISHED so the
        // student GET /api/marks now returns finals + grades.
        FacultySection fs = gs.getFacultySection();
        List<MarksInstrument> instruments =
                instrumentRepository.findByFacultySectionIdOrderByDisplayOrderAsc(fs.getId());
        for (MarksInstrument ins : instruments) {
            if (ins.getCategory() == MarksInstrument.Category.FINAL
                    && ins.getPublishState() == MarksInstrument.PublishState.DRAFT) {
                ins.setPublishState(MarksInstrument.PublishState.PUBLISHED);
                ins.setPublishedAt(LocalDateTime.now());
            }
        }
        instrumentRepository.saveAll(instruments);

        // Persist final grade onto the enrollment so transcripts pick it up.
        GradeListDTO list = buildGradeList(fs);
        Map<Long, GradeRowDTO> byEnrollment = list.getRows().stream()
                .collect(Collectors.toMap(GradeRowDTO::getEnrollmentId, r -> r));
        List<Enrollment> enrolled = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                fs.getCourse().getId(), fs.getSection(), fs.getSemester());
        for (Enrollment e : enrolled) {
            GradeRowDTO row = byEnrollment.get(e.getId());
            if (row != null && row.getLetterGrade() != null) {
                e.setGrade(row.getLetterGrade());
                e.setPoints(row.getGradePoints());
            }
        }
        enrollmentRepository.saveAll(enrolled);
        return list;
    }

    @Transactional
    public GradeListDTO reject(Long submissionId, String remarks) {
        GradeSubmission gs = mustBeSubmitted(submissionId);
        if (remarks == null || remarks.isBlank()) {
            throw new IllegalArgumentException("Reject reason is required.");
        }
        gs.setState(GradeSubmission.State.REJECTED);
        gs.setDecidedAt(LocalDateTime.now());
        gs.setHodRemarks(remarks);
        gradeSubmissionRepository.save(gs);
        return buildGradeList(gs.getFacultySection());
    }

    private GradeSubmission mustBeSubmitted(Long submissionId) {
        GradeSubmission gs = gradeSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown submission " + submissionId));
        if (gs.getState() != GradeSubmission.State.SUBMITTED) {
            throw new IllegalStateException("Submission is " + gs.getState() + ", not SUBMITTED");
        }
        return gs;
    }

    // ── Computation ──

    private GradeListDTO buildGradeList(FacultySection fs) {
        GradeListDTO out = new GradeListDTO();
        out.setSectionId(fs.getId());
        out.setCourseCode(fs.getCourse().getCode());
        out.setCourseName(fs.getCourse().getName());
        out.setSection(fs.getSection());
        out.setSemester(fs.getSemester());
        out.setFacultyName(fs.getFaculty() == null ? null : fs.getFaculty().getName());
        out.setScheme(fs.getCourse().getGradingScheme().name());

        GradeSubmission gs = gradeSubmissionRepository.findByFacultySectionId(fs.getId()).orElse(null);
        if (gs != null) {
            out.setState(gs.getState().name());
            out.setHodRemarks(gs.getHodRemarks());
        }

        List<MarksInstrument> instruments =
                instrumentRepository.findByFacultySectionIdOrderByDisplayOrderAsc(fs.getId());
        double totalWeight = instruments.stream()
                .flatMap(i -> i.getComponents().stream())
                .mapToDouble(MarksComponent::getWeightage).sum();
        out.setTotalWeight(round1(totalWeight));

        List<Enrollment> enrolled = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                fs.getCourse().getId(), fs.getSection(), fs.getSemester());

        // Pull all marks once, group by enrollment.
        Map<Long, Map<Long, Double>> scoreByEnrollment = new HashMap<>();
        for (MarksInstrument ins : instruments) {
            for (MarksComponent c : ins.getComponents()) {
                for (Marks m : marksRepository.findByComponentId(c.getId())) {
                    if (m.getEnrollment() == null || m.getObtained() == null) continue;
                    scoreByEnrollment
                            .computeIfAbsent(m.getEnrollment().getId(), k -> new HashMap<>())
                            .put(c.getId(), m.getObtained());
                }
            }
        }

        List<GradeRowDTO> rows = new ArrayList<>();
        List<Double> percentages = new ArrayList<>();
        List<String> blockers = new ArrayList<>();
        boolean missingAnywhere = false;

        for (Enrollment e : enrolled) {
            if (e.getStudent() == null) continue;
            GradeRowDTO row = new GradeRowDTO();
            row.setEnrollmentId(e.getId());
            row.setRollNo(e.getStudent().getRollNo());
            row.setName(e.getStudent().getName());

            double weighted = 0;
            boolean missing = false;
            Map<Long, Double> scores = scoreByEnrollment.getOrDefault(e.getId(), Map.of());
            for (MarksInstrument ins : instruments) {
                for (MarksComponent c : ins.getComponents()) {
                    Double obt = scores.get(c.getId());
                    if (obt == null) { missing = true; continue; }
                    if (c.getMaxMarks() > 0) {
                        weighted += (obt / c.getMaxMarks()) * c.getWeightage();
                    }
                }
            }
            if (missing) {
                row.setReason("Missing scores");
                missingAnywhere = true;
            } else {
                row.setPercentage(round1(weighted));
                percentages.add(weighted);
            }
            rows.add(row);
        }

        // Apply scheme to assign letter grades.
        boolean weightOk = Math.abs(totalWeight - 100.0) < 0.01;
        if (weightOk && !missingAnywhere) {
            applyScheme(rows, percentages, fs.getCourse().getGradingScheme());
        }

        // Distribution + mean.
        Map<String, Integer> dist = new LinkedHashMap<>();
        for (String g : new String[]{"A+","A","A-","B+","B","B-","C+","C","C-","D","F"}) dist.put(g, 0);
        for (GradeRowDTO r : rows) {
            if (r.getLetterGrade() != null) dist.merge(r.getLetterGrade(), 1, Integer::sum);
        }
        out.setDistribution(dist);
        out.setMeanPercentage(percentages.isEmpty() ? null
                : round1(percentages.stream().mapToDouble(Double::doubleValue).average().orElse(0)));

        // Submit gating.
        if (!weightOk) blockers.add("Total weight " + round1(totalWeight) + "% must equal 100%");
        if (missingAnywhere) blockers.add("One or more students have missing scores");
        if (instruments.isEmpty()) blockers.add("No instruments defined");
        out.setBlockers(blockers);
        out.setReadyToSubmit(blockers.isEmpty());

        out.setRows(rows);
        return out;
    }

    private static void applyScheme(List<GradeRowDTO> rows, List<Double> pcts, Course.GradingScheme scheme) {
        if (rows.isEmpty()) return;
        switch (scheme) {
            case ABSOLUTE -> rows.forEach(r -> {
                if (r.getPercentage() != null) {
                    String g = absoluteGrade(r.getPercentage());
                    r.setLetterGrade(g);
                    r.setGradePoints(gradePoints(g));
                }
            });
            case RELATIVE -> {
                // Simple curve: shift around mean. Cutoffs: A+ ≥ μ+1.5σ, A ≥ μ+σ, A- ≥ μ+0.5σ,
                //   B+ ≥ μ, B ≥ μ-0.5σ, B- ≥ μ-σ, C+ ≥ μ-1.25σ, C ≥ μ-1.5σ, C- ≥ μ-1.75σ,
                //   D ≥ μ-2σ, F otherwise.
                double mean = pcts.stream().mapToDouble(Double::doubleValue).average().orElse(0);
                double var = pcts.stream().mapToDouble(p -> Math.pow(p - mean, 2)).sum()
                        / Math.max(1, pcts.size());
                double sd = Math.sqrt(var);
                rows.forEach(r -> {
                    if (r.getPercentage() == null) return;
                    double p = r.getPercentage();
                    String g;
                    if (p >= mean + 1.5 * sd) g = "A+";
                    else if (p >= mean + 1.0 * sd) g = "A";
                    else if (p >= mean + 0.5 * sd) g = "A-";
                    else if (p >= mean) g = "B+";
                    else if (p >= mean - 0.5 * sd) g = "B";
                    else if (p >= mean - 1.0 * sd) g = "B-";
                    else if (p >= mean - 1.25 * sd) g = "C+";
                    else if (p >= mean - 1.5 * sd) g = "C";
                    else if (p >= mean - 1.75 * sd) g = "C-";
                    else if (p >= mean - 2.0 * sd) g = "D";
                    else g = "F";
                    r.setLetterGrade(g);
                    r.setGradePoints(gradePoints(g));
                });
            }
        }
    }

    private static String absoluteGrade(double p) {
        if (p >= 85) return "A+";
        if (p >= 80) return "A";
        if (p >= 75) return "A-";
        if (p >= 70) return "B+";
        if (p >= 65) return "B";
        if (p >= 60) return "B-";
        if (p >= 55) return "C+";
        if (p >= 50) return "C";
        if (p >= 45) return "C-";
        if (p >= 40) return "D";
        return "F";
    }

    private static Double gradePoints(String g) {
        return switch (g) {
            case "A+" -> 4.0;
            case "A"  -> 4.0;
            case "A-" -> 3.67;
            case "B+" -> 3.33;
            case "B"  -> 3.0;
            case "B-" -> 2.67;
            case "C+" -> 2.33;
            case "C"  -> 2.0;
            case "C-" -> 1.67;
            case "D"  -> 1.0;
            case "F"  -> 0.0;
            default -> null;
        };
    }

    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }
}
