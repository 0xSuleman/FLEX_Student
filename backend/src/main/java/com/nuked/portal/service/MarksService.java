package com.nuked.portal.service;

import com.nuked.portal.dto.MarksDTO;
import com.nuked.portal.model.Enrollment;
import com.nuked.portal.model.Marks;
import com.nuked.portal.repository.EnrollmentRepository;
import com.nuked.portal.repository.MarksRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarksService {

    private final EnrollmentRepository enrollmentRepository;
    private final MarksRepository marksRepository;

    public List<MarksDTO> getMarksBySemester(Long studentId, String semester) {
        List<Enrollment> enrollments = enrollmentRepository.findByStudentIdAndSemester(studentId, semester);
        List<MarksDTO> result = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            List<Marks> marksList = marksRepository.findByEnrollmentId(enrollment.getId());

            MarksDTO dto = new MarksDTO();
            dto.setCourseCode(enrollment.getCourse().getCode());
            dto.setCourseName(enrollment.getCourse().getName());
            dto.setSemester(enrollment.getSemester());

            List<MarksDTO.EvaluationDTO> evaluations = marksList.stream().map(m -> {
                MarksDTO.EvaluationDTO eval = new MarksDTO.EvaluationDTO();
                eval.setId(m.getId());
                eval.setEvaluationType(m.getEvaluationType().name());
                eval.setEvaluationName(m.getEvaluationName());
                eval.setWeightage(m.getWeightage());
                eval.setObtained(m.getObtained());
                eval.setTotal(m.getTotal());
                eval.setAverage(m.getAverage());
                eval.setStdDev(m.getStdDev());
                eval.setMin(m.getMin());
                eval.setMax(m.getMax());
                return eval;
            }).collect(Collectors.toList());
            dto.setEvaluations(evaluations);

            result.add(dto);
        }

        return result;
    }
}
