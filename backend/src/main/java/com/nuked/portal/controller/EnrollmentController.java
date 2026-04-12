package com.nuked.portal.controller;

import com.nuked.portal.dto.EnrollmentDTO;
import com.nuked.portal.model.Enrollment;
import com.nuked.portal.model.Student;
import com.nuked.portal.repository.EnrollmentRepository;
import com.nuked.portal.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<List<EnrollmentDTO>> getEnrollments(
            Authentication auth,
            @RequestParam(required = false) String semester) {
        Student student = studentService.findByRollNo(auth.getName());

        List<Enrollment> enrollments;
        if (semester != null && !semester.isEmpty()) {
            enrollments = enrollmentRepository.findByStudentIdAndSemester(student.getId(), semester);
        } else {
            enrollments = enrollmentRepository.findByStudentId(student.getId());
        }

        List<EnrollmentDTO> dtos = enrollments.stream().map(e -> {
            EnrollmentDTO dto = new EnrollmentDTO();
            dto.setId(e.getId());
            dto.setCourseCode(e.getCourse().getCode());
            dto.setCourseName(e.getCourse().getName());
            dto.setCreditHours(e.getCourse().getCreditHours());
            dto.setCourseType(e.getCourse().getType() != null ? e.getCourse().getType().name() : null);
            dto.setSemester(e.getSemester());
            dto.setSection(e.getSection());
            dto.setGrade(e.getGrade());
            dto.setPoints(e.getPoints());
            dto.setRemarks(e.getRemarks());
            dto.setStatus(e.getStatus());
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<List<EnrollmentDTO>> registerCourses(
            Authentication auth,
            @RequestBody Map<String, Object> request) {
        Student student = studentService.findByRollNo(auth.getName());

        String semester = (String) request.get("semester");
        List<String> courseCodes = (List<String>) request.get("courses");

        // For now, return the existing enrollments for this semester
        // A full implementation would create new enrollments
        List<Enrollment> enrollments = enrollmentRepository.findByStudentIdAndSemester(student.getId(), semester);

        List<EnrollmentDTO> dtos = enrollments.stream().map(e -> {
            EnrollmentDTO dto = new EnrollmentDTO();
            dto.setId(e.getId());
            dto.setCourseCode(e.getCourse().getCode());
            dto.setCourseName(e.getCourse().getName());
            dto.setCreditHours(e.getCourse().getCreditHours());
            dto.setCourseType(e.getCourse().getType() != null ? e.getCourse().getType().name() : null);
            dto.setSemester(e.getSemester());
            dto.setSection(e.getSection());
            dto.setGrade(e.getGrade());
            dto.setPoints(e.getPoints());
            dto.setRemarks(e.getRemarks());
            dto.setStatus(e.getStatus());
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
