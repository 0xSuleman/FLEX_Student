package com.nuked.portal.service;

import com.nuked.portal.dto.EnrollmentDTO;
import com.nuked.portal.model.Course;
import com.nuked.portal.model.Enrollment;
import com.nuked.portal.model.Student;
import com.nuked.portal.repository.CourseRepository;
import com.nuked.portal.repository.EnrollmentRepository;
import com.nuked.portal.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;

    public List<EnrollmentDTO> getEnrollments(Long studentId, String semester) {
        List<Enrollment> enrollments;

        if (semester != null && !semester.isBlank()) {
            enrollments = enrollmentRepository.findByStudentIdAndSemester(studentId, semester);
        } else {
            enrollments = enrollmentRepository.findByStudentId(studentId);
        }

        return enrollments.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<EnrollmentDTO> registerCourses(Long studentId, List<String> courseCodes, String semester) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));

        List<EnrollmentDTO> result = new ArrayList<>();

        for (String code : courseCodes) {
            Course course = courseRepository.findByCode(code)
                    .orElseThrow(() -> new RuntimeException("Course not found with code: " + code));

            Enrollment enrollment = new Enrollment();
            enrollment.setStudent(student);
            enrollment.setCourse(course);
            enrollment.setSemester(semester);
            enrollment.setSection(student.getSection());
            enrollment.setStatus("IN_PROGRESS");

            Enrollment saved = enrollmentRepository.save(enrollment);
            result.add(mapToDTO(saved));
        }

        return result;
    }

    private EnrollmentDTO mapToDTO(Enrollment enrollment) {
        EnrollmentDTO dto = new EnrollmentDTO();
        dto.setId(enrollment.getId());
        dto.setCourseCode(enrollment.getCourse().getCode());
        dto.setCourseName(enrollment.getCourse().getName());
        dto.setCreditHours(enrollment.getCourse().getCreditHours());
        dto.setCourseType(enrollment.getCourse().getType() != null ? enrollment.getCourse().getType().name() : null);
        dto.setSemester(enrollment.getSemester());
        dto.setSection(enrollment.getSection());
        dto.setGrade(enrollment.getGrade());
        dto.setPoints(enrollment.getPoints());
        dto.setRemarks(enrollment.getRemarks());
        dto.setStatus(enrollment.getStatus());
        return dto;
    }
}
