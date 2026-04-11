package com.flex.student.service;

import com.flex.student.dto.MarksDTO;
import com.flex.student.model.Enrollment;
import com.flex.student.model.Marks;
import com.flex.student.repository.EnrollmentRepository;
import com.flex.student.repository.MarksRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MarksService {

    private final EnrollmentRepository enrollmentRepository;
    private final MarksRepository marksRepository;

    public MarksService(EnrollmentRepository enrollmentRepository, MarksRepository marksRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.marksRepository = marksRepository;
    }

    public List<MarksDTO> getMarksBySemester(Long studentId, String semester) {
        List<Enrollment> enrollments = enrollmentRepository.findByStudentIdAndSemester(studentId, semester);
        List<MarksDTO> result = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            List<Marks> marksList = marksRepository.findByEnrollmentId(enrollment.getId());
            if (marksList.isEmpty()) continue;

            MarksDTO dto = new MarksDTO();
            dto.setCourseCode(enrollment.getCourse().getCode());
            dto.setCourseName(enrollment.getCourse().getName());
            dto.setSemester(semester);

            List<MarksDTO.MarkEntryDTO> entries = marksList.stream().map(m -> {
                MarksDTO.MarkEntryDTO entry = new MarksDTO.MarkEntryDTO();
                entry.setId(m.getId());
                entry.setEvaluationType(m.getEvaluationType().name());
                entry.setEvaluationName(m.getEvaluationName());
                entry.setWeightage(m.getWeightage());
                entry.setObtained(m.getObtained());
                entry.setTotal(m.getTotal());
                entry.setAverage(m.getAverage());
                entry.setStdDev(m.getStdDev());
                entry.setMin(m.getMin());
                entry.setMax(m.getMax());
                return entry;
            }).collect(Collectors.toList());
            dto.setMarks(entries);

            result.add(dto);
        }

        return result;
    }
}
