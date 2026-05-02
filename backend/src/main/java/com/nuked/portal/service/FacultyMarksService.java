package com.nuked.portal.service;

import com.nuked.portal.dto.*;
import com.nuked.portal.excel.MarksExcelExporter;
import com.nuked.portal.excel.MarksExcelImporter;
import com.nuked.portal.model.*;
import com.nuked.portal.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FacultyMarksService {

    private final FacultyService facultyService;
    private final FacultySectionRepository facultySectionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final MarksInstrumentRepository instrumentRepository;
    private final MarksComponentRepository componentRepository;
    private final MarksRepository marksRepository;
    private final GradeSubmissionRepository gradeSubmissionRepository;

    /** Faculty view: definitions + roster + per-component scores in one shot. */
    @Transactional
    public SectionMarksDTO loadSection(String username, Long facultySectionId) {
        FacultySection fs = facultyService.ownedSection(username, facultySectionId);

        List<MarksInstrument> instruments =
                instrumentRepository.findByFacultySectionIdOrderByDisplayOrderAsc(fs.getId());
        List<Enrollment> enrolled = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                fs.getCourse().getId(), fs.getSection(), fs.getSemester());

        SectionMarksDTO out = new SectionMarksDTO();
        out.setInstruments(instruments.stream().map(FacultyMarksService::toInstrumentDto).toList());
        out.setRoster(enrolled.stream()
                .filter(e -> e.getStudent() != null)
                .map(e -> new RosterEntryDTO(
                        e.getId(), e.getStudent().getRollNo(),
                        e.getStudent().getName(), e.getStudent().getDegree()))
                .toList());

        Map<Long, Map<Long, Double>> scores = new HashMap<>();
        for (MarksInstrument ins : instruments) {
            for (MarksComponent c : ins.getComponents()) {
                List<Marks> rows = marksRepository.findByComponentId(c.getId());
                Map<Long, Double> byEnrollment = new HashMap<>();
                for (Marks m : rows) {
                    if (m.getEnrollment() != null && m.getObtained() != null) {
                        byEnrollment.put(m.getEnrollment().getId(), m.getObtained());
                    }
                }
                if (!byEnrollment.isEmpty()) scores.put(c.getId(), byEnrollment);
            }
        }
        out.setScores(scores);

        gradeSubmissionRepository.findByFacultySectionId(fs.getId()).ifPresent(gs -> {
            out.setGradeSubmissionState(gs.getState().name());
            out.setGradeSubmissionRemarks(gs.getHodRemarks());
        });

        return out;
    }

    /**
     * Replace this section's instrument set with the payload.
     * Mid-semester categories (Quiz/Assignment/Sessional) are auto-published.
     * FINAL stays DRAFT until the HOD-approved grade submission flips it.
     */
    @Transactional
    public SectionMarksDTO saveInstruments(String username, Long facultySectionId,
                                           SaveInstrumentsRequest req) {
        FacultySection fs = facultyService.ownedSection(username, facultySectionId);

        if (req == null || req.getInstruments() == null) {
            throw new IllegalArgumentException("instruments payload is required");
        }

        // 4.4.3: total weight must not exceed 100%.
        double totalWeight = req.getInstruments().stream()
                .filter(Objects::nonNull)
                .flatMap(i -> i.getComponents() == null
                        ? java.util.stream.Stream.empty()
                        : i.getComponents().stream())
                .mapToDouble(ComponentDTO::getWeightage).sum();
        if (totalWeight > 100.0001) {
            throw new IllegalArgumentException(
                    "Total weightage " + totalWeight + "% exceeds 100% (per req 4.4.3).");
        }

        List<MarksInstrument> existing =
                instrumentRepository.findByFacultySectionIdOrderByDisplayOrderAsc(fs.getId());
        Map<Long, MarksInstrument> existingById = new HashMap<>();
        Map<String, MarksInstrument> existingByName = new HashMap<>();
        for (MarksInstrument m : existing) {
            existingById.put(m.getId(), m);
            existingByName.put(m.getName(), m);
        }

        Set<Long> keptInstrumentIds = new HashSet<>();
        List<MarksInstrument> finalList = new ArrayList<>();

        // Delete orphans FIRST (before insert) so the (section, name) unique
        // constraint doesn't fire on replace-by-name. We compute the set of
        // names the payload retains, then delete every existing row whose
        // name isn't in that set, flushing before any insert.
        Set<String> payloadNames = req.getInstruments().stream()
                .map(InstrumentDTO::getName).collect(java.util.stream.Collectors.toSet());
        for (MarksInstrument old : new ArrayList<>(existing)) {
            if (!payloadNames.contains(old.getName())) {
                for (MarksComponent c : old.getComponents()) {
                    marksRepository.findByComponentId(c.getId()).forEach(marksRepository::delete);
                }
                instrumentRepository.delete(old);
                existing.remove(old);
                existingById.remove(old.getId());
                existingByName.remove(old.getName());
            }
        }
        instrumentRepository.flush();

        for (InstrumentDTO d : req.getInstruments()) {
            MarksInstrument ins;
            if (d.getId() != null && existingById.containsKey(d.getId())) {
                ins = existingById.get(d.getId());
                keptInstrumentIds.add(ins.getId());
            } else if (existingByName.containsKey(d.getName())) {
                // Same-name match — treat it as the same instrument so the
                // unique (section, name) constraint can't trip.
                ins = existingByName.get(d.getName());
                keptInstrumentIds.add(ins.getId());
            } else {
                ins = new MarksInstrument();
                ins.setFacultySection(fs);
                ins.setPublishState(MarksInstrument.PublishState.DRAFT);
            }
            ins.setCategory(MarksInstrument.Category.valueOf(d.getCategory()));
            ins.setName(d.getName());
            ins.setDisplayOrder(d.getDisplayOrder());

            // Auto-publish mid-semester instruments per req 3.4.4.
            // FINAL stays DRAFT; it flips to PUBLISHED when the section's
            // GradeSubmission is HOD-APPROVED (handled by the grade flow).
            if (ins.getCategory() != MarksInstrument.Category.FINAL
                    && ins.getPublishState() == MarksInstrument.PublishState.DRAFT) {
                ins.setPublishState(MarksInstrument.PublishState.PUBLISHED);
                ins.setPublishedAt(LocalDateTime.now());
            }

            // Components: replace the list (orphanRemoval handles deletes).
            Map<Long, MarksComponent> compById = new HashMap<>();
            for (MarksComponent c : ins.getComponents()) compById.put(c.getId(), c);
            List<MarksComponent> newComps = new ArrayList<>();
            Set<Long> keptCompIds = new HashSet<>();
            for (ComponentDTO cd : d.getComponents() == null ? List.<ComponentDTO>of() : d.getComponents()) {
                MarksComponent c;
                if (cd.getId() != null && compById.containsKey(cd.getId())) {
                    c = compById.get(cd.getId());
                    keptCompIds.add(c.getId());
                } else {
                    c = new MarksComponent();
                    c.setInstrument(ins);
                }
                c.setName(cd.getName());
                c.setMaxMarks(cd.getMaxMarks());
                c.setWeightage(cd.getWeightage());
                c.setDisplayOrder(cd.getDisplayOrder());
                newComps.add(c);
            }
            // Drop scores for removed components before orphanRemoval kicks in.
            for (MarksComponent c : ins.getComponents()) {
                if (c.getId() != null && !keptCompIds.contains(c.getId())) {
                    marksRepository.findByComponentId(c.getId()).forEach(marksRepository::delete);
                }
            }
            ins.getComponents().clear();
            ins.getComponents().addAll(newComps);
            finalList.add(ins);
        }

        instrumentRepository.saveAll(finalList);

        return loadSection(username, facultySectionId);
    }

    /** Upsert per-(component, enrollment) score. */
    @Transactional
    public void saveScores(String username, Long facultySectionId, SaveScoresRequest req) {
        FacultySection fs = facultyService.ownedSection(username, facultySectionId);
        if (req == null || req.getScores() == null) return;

        for (SaveScoresRequest.ScoreEntry e : req.getScores()) {
            if (e.getComponentId() == null || e.getEnrollmentId() == null) continue;

            MarksComponent comp = componentRepository.findById(e.getComponentId())
                    .orElseThrow(() -> new IllegalArgumentException("Unknown component " + e.getComponentId()));
            // Defense in depth: component must belong to this faculty's section.
            if (!comp.getInstrument().getFacultySection().getId().equals(fs.getId())) {
                throw new AccessDeniedException("Component not in your section");
            }
            Enrollment enrollment = enrollmentRepository.findById(e.getEnrollmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Unknown enrollment " + e.getEnrollmentId()));
            // Enrollment must be in the same course/section/semester.
            if (!enrollment.getCourse().getId().equals(fs.getCourse().getId())
                    || !Objects.equals(enrollment.getSection(), fs.getSection())
                    || !Objects.equals(enrollment.getSemester(), fs.getSemester())) {
                throw new AccessDeniedException("Enrollment not in your section");
            }
            if (e.getObtained() != null) {
                double v = e.getObtained();
                if (v < 0 || v > comp.getMaxMarks() + 0.0001) {
                    throw new IllegalArgumentException(
                            "Score " + v + " out of range [0, " + comp.getMaxMarks() + "] for " + comp.getName());
                }
            }

            Optional<Marks> opt = marksRepository.findByEnrollmentIdAndComponentId(
                    enrollment.getId(), comp.getId());
            Marks m = opt.orElseGet(Marks::new);
            m.setEnrollment(enrollment);
            m.setComponent(comp);
            // Denormalize for backward compatibility with existing student GET path
            // and stat-aggregation code that reads from legacy columns.
            m.setEvaluationType(toLegacyType(comp.getInstrument().getCategory()));
            m.setEvaluationName(comp.getInstrument().getName() + " · " + comp.getName());
            m.setWeightage(comp.getWeightage());
            m.setTotal(comp.getMaxMarks());
            m.setObtained(e.getObtained());
            marksRepository.save(m);
        }
    }

    private static Marks.EvaluationType toLegacyType(MarksInstrument.Category c) {
        return switch (c) {
            case QUIZ -> Marks.EvaluationType.QUIZ;
            case ASSIGNMENT -> Marks.EvaluationType.ASSIGNMENT;
            case SESSIONAL_1 -> Marks.EvaluationType.SESSIONAL_1;
            case SESSIONAL_2 -> Marks.EvaluationType.SESSIONAL_2;
            case FINAL -> Marks.EvaluationType.FINAL;
        };
    }

    /** Build the Flex-formatted xlsx template for this section (req 4.5.3). */
    @Transactional
    public byte[] exportTemplate(String username, Long facultySectionId) throws IOException {
        FacultySection fs = facultyService.ownedSection(username, facultySectionId);
        List<MarksInstrument> instruments =
                instrumentRepository.findByFacultySectionIdOrderByDisplayOrderAsc(fs.getId());
        if (instruments.isEmpty()) {
            throw new IllegalStateException(
                    "No instruments defined yet — define at least one before downloading the template.");
        }
        List<Enrollment> enrolled = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                fs.getCourse().getId(), fs.getSection(), fs.getSemester());
        List<MarksExcelExporter.RosterRow> roster = enrolled.stream()
                .filter(e -> e.getStudent() != null)
                .map(e -> new MarksExcelExporter.RosterRow(
                        e.getId(), e.getStudent().getRollNo(), e.getStudent().getName()))
                .toList();
        return new MarksExcelExporter(fs, instruments, roster, marksRepository).build();
    }

    /**
     * Parse + validate an uploaded marks sheet, then apply the parsed scores
     * via the same code path as manual save. Rejects per req 4.5.4 if the
     * column count, order, or labels diverge from the exported format.
     */
    @Transactional
    public UploadResultDTO uploadFilledTemplate(String username, Long facultySectionId,
                                                MultipartFile file) {
        FacultySection fs = facultyService.ownedSection(username, facultySectionId);
        List<MarksInstrument> instruments =
                instrumentRepository.findByFacultySectionIdOrderByDisplayOrderAsc(fs.getId());

        MarksExcelImporter importer = new MarksExcelImporter(fs.getId(), instruments);
        MarksExcelImporter.ParseOutcome outcome;
        try (InputStream in = file.getInputStream()) {
            outcome = importer.parse(in);
        } catch (IOException ex) {
            UploadResultDTO err = new UploadResultDTO();
            err.setOk(false);
            err.getStructureErrors().add("Could not read xlsx: " + ex.getMessage());
            return err;
        }

        UploadResultDTO summary = outcome.summary();
        if (!summary.isOk()) return summary;     // structure or row errors → don't apply

        List<Enrollment> enrolled = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                fs.getCourse().getId(), fs.getSection(), fs.getSemester());
        Map<String, Long> enrollmentByRoll = new HashMap<>();
        for (Enrollment e : enrolled) {
            if (e.getStudent() != null) enrollmentByRoll.put(e.getStudent().getRollNo(), e.getId());
        }

        SaveScoresRequest req = new SaveScoresRequest();
        List<SaveScoresRequest.ScoreEntry> entries = new ArrayList<>();
        int applied = 0;
        for (MarksExcelImporter.ParsedScore p : outcome.scores()) {
            Long enrollmentId = enrollmentByRoll.get(p.rollNo());
            if (enrollmentId == null) {
                summary.getErrors().add(new UploadResultDTO.RowError(
                        p.rowNumber(), p.rollNo(),
                        "Roll number not found in section roster — student must be enrolled first."));
                continue;
            }
            SaveScoresRequest.ScoreEntry e = new SaveScoresRequest.ScoreEntry();
            e.setComponentId(p.componentId());
            e.setEnrollmentId(enrollmentId);
            e.setObtained(p.obtained());
            entries.add(e);
            applied++;
        }
        if (!summary.getErrors().isEmpty()) {
            summary.setOk(false);
            return summary;
        }
        req.setScores(entries);
        saveScores(username, facultySectionId, req);
        summary.setRowsApplied(applied);
        summary.setOk(true);
        return summary;
    }

    static InstrumentDTO toInstrumentDto(MarksInstrument ins) {
        InstrumentDTO d = new InstrumentDTO();
        d.setId(ins.getId());
        d.setCategory(ins.getCategory().name());
        d.setName(ins.getName());
        d.setDisplayOrder(ins.getDisplayOrder());
        d.setPublishState(ins.getPublishState().name());
        d.setComponents(ins.getComponents().stream().map(c -> {
            ComponentDTO cd = new ComponentDTO();
            cd.setId(c.getId());
            cd.setName(c.getName());
            cd.setMaxMarks(c.getMaxMarks());
            cd.setWeightage(c.getWeightage());
            cd.setDisplayOrder(c.getDisplayOrder());
            return cd;
        }).toList());
        return d;
    }
}
