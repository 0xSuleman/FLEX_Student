package com.flex.student.service;

import com.flex.student.dto.EnrollmentDTO;
import com.flex.student.model.Course;
import com.flex.student.model.Enrollment;
import com.flex.student.model.Student;
import com.flex.student.repository.CourseRepository;
import com.flex.student.repository.EnrollmentRepository;
import com.flex.student.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             CourseRepository courseRepository,
                             StudentRepository studentRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.studentRepository = studentRepository;
    }

    public List<EnrollmentDTO> getEnrollments(Long studentId, String semester) {
        List<Enrollment> enrollments;
        if (semester != null && !semester.isBlank()) {
            enrollments = enrollmentRepository.findByStudentIdAndSemester(studentId, semester);
        } else {
            enrollments = enrollmentRepository.findByStudentId(studentId);
        }
        return enrollments.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<EnrollmentDTO> registerCourses(Long studentId, List<String> courseCodes, String semester, String section) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Enrollment> newEnrollments = courseCodes.stream().map(code -> {
            Course course = courseRepository.findByCode(code)
                    .orElseThrow(() -> new RuntimeException("Course not found: " + code));

            Enrollment enrollment = new Enrollment();
            enrollment.setStudent(student);
            enrollment.setCourse(course);
            enrollment.setSemester(semester);
            enrollment.setSection(section);
            enrollment.setStatus("ENROLLED");
            return enrollmentRepository.save(enrollment);
        }).collect(Collectors.toList());

        return newEnrollments.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public void withdrawCourse(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        enrollment.setStatus("WITHDRAWN");
        enrollmentRepository.save(enrollment);
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
