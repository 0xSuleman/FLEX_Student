package com.nuked.portal.service;

import com.nuked.portal.dto.MarksDTO;
import com.nuked.portal.model.Enrollment;
import com.nuked.portal.model.GradeSubmission;
import com.nuked.portal.model.Marks;
import com.nuked.portal.model.MarksComponent;
import com.nuked.portal.model.MarksInstrument;
import com.nuked.portal.repository.EnrollmentRepository;
import com.nuked.portal.repository.GradeSubmissionRepository;
import com.nuked.portal.repository.MarksRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarksService {

    private final EnrollmentRepository enrollmentRepository;
    private final MarksRepository marksRepository;
    private final GradeSubmissionRepository gradeSubmissionRepository;

    public List<MarksDTO> getMarksBySemester(Long studentId, String semester) {
        List<Enrollment> enrollments = enrollmentRepository.findByStudentIdAndSemester(studentId, semester);
        List<MarksDTO> result = new ArrayList<>();

        // Cache per-section grade-submission state so we don't hit the DB
        // once per row when a student is enrolled in many sections.
        Map<Long, GradeSubmission.State> gradeStateBySection = new HashMap<>();

        for (Enrollment enrollment : enrollments) {
            List<Marks> marksList = marksRepository.findByEnrollmentId(enrollment.getId());

            List<Marks> visible = marksList.stream()
                    .filter(m -> isVisibleToStudent(m, enrollment, gradeStateBySection))
                    .toList();

            MarksDTO dto = new MarksDTO();
            dto.setCourseCode(enrollment.getCourse().getCode());
            dto.setCourseName(enrollment.getCourse().getName());
            dto.setSemester(enrollment.getSemester());

            // Stats over all student rows for the same component, computed live
            // so the UI doesn't need to be re-saved every time a faculty edits.
            Map<Long, ClassStats> statsByComponent = new HashMap<>();

            List<MarksDTO.EvaluationDTO> evaluations = visible.stream().map(m -> {
                MarksDTO.EvaluationDTO eval = new MarksDTO.EvaluationDTO();
                eval.setId(m.getId());
                eval.setEvaluationType(m.getEvaluationType() == null ? null : m.getEvaluationType().name());
                eval.setEvaluationName(m.getEvaluationName());
                eval.setWeightage(m.getWeightage());
                eval.setObtained(m.getObtained());
                eval.setTotal(m.getTotal());

                // Prefer live class stats for component-backed rows; fall back to
                // legacy denormalized columns for seed data.
                if (m.getComponent() != null) {
                    ClassStats s = statsByComponent.computeIfAbsent(
                            m.getComponent().getId(), id -> computeStats(id));
                    eval.setAverage(s.avg);
                    eval.setStdDev(s.stdDev);
                    eval.setMin(s.min);
                    eval.setMax(s.max);
                } else {
                    eval.setAverage(m.getAverage());
                    eval.setStdDev(m.getStdDev());
                    eval.setMin(m.getMin());
                    eval.setMax(m.getMax());
                }
                return eval;
            }).collect(Collectors.toList());
            dto.setEvaluations(evaluations);

            result.add(dto);
        }

        return result;
    }

    /**
     * Visibility rules per SRS:
     *   3.4.4 — mid-sem marks visible as soon as faculty enters them
     *   3.4.5 — final marks/grades hidden until HOD approves
     * Legacy seed rows (no component) bypass this (always visible) so the
     * demo data continues to work; new faculty-driven rows are gated.
     */
    private boolean isVisibleToStudent(Marks m, Enrollment enrollment,
                                        Map<Long, GradeSubmission.State> gradeStateBySection) {
        MarksComponent comp = m.getComponent();
        if (comp == null) return true;       // legacy seed row

        MarksInstrument ins = comp.getInstrument();
        if (ins == null) return true;

        // Mid-sem: visible iff instrument PUBLISHED.
        if (ins.getCategory() != MarksInstrument.Category.FINAL) {
            return ins.getPublishState() == MarksInstrument.PublishState.PUBLISHED;
        }

        // FINAL: only after HOD approves the section's grade submission.
        Long sectionId = ins.getFacultySection() == null ? null : ins.getFacultySection().getId();
        if (sectionId == null) return false;
        GradeSubmission.State state = gradeStateBySection.computeIfAbsent(sectionId, sid ->
                gradeSubmissionRepository.findByFacultySectionId(sid)
                        .map(GradeSubmission::getState).orElse(null));
        return state == GradeSubmission.State.APPROVED;
    }

    private ClassStats computeStats(Long componentId) {
        List<Marks> rows = marksRepository.findByComponentId(componentId);
        DoubleSummaryStatistics ss = rows.stream()
                .filter(r -> r.getObtained() != null)
                .mapToDouble(Marks::getObtained).summaryStatistics();
        if (ss.getCount() == 0) return new ClassStats(null, null, null, null);
        double avg = ss.getAverage();
        double sumSq = rows.stream()
                .filter(r -> r.getObtained() != null)
                .mapToDouble(r -> Math.pow(r.getObtained() - avg, 2)).sum();
        double std = Math.sqrt(sumSq / ss.getCount());
        return new ClassStats(round1(avg), round1(std), round1(ss.getMin()), round1(ss.getMax()));
    }

    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }

    private record ClassStats(Double avg, Double stdDev, Double min, Double max) {}
}
