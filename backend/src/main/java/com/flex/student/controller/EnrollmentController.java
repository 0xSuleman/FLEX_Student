package com.flex.student.controller;

import com.flex.student.dto.EnrollmentDTO;
import com.flex.student.model.Student;
import com.flex.student.service.EnrollmentService;
import com.flex.student.service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final StudentService studentService;

    public EnrollmentController(EnrollmentService enrollmentService, StudentService studentService) {
        this.enrollmentService = enrollmentService;
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<List<EnrollmentDTO>> getEnrollments(
            Authentication authentication,
            @RequestParam(required = false) String semester) {
        Student student = studentService.findByRollNo(authentication.getName());
        List<EnrollmentDTO> enrollments = enrollmentService.getEnrollments(student.getId(), semester);
        return ResponseEntity.ok(enrollments);
    }

    @PostMapping("/register")
    public ResponseEntity<List<EnrollmentDTO>> registerCourses(
            Authentication authentication,
            @RequestBody Map<String, Object> request) {
        Student student = studentService.findByRollNo(authentication.getName());
        @SuppressWarnings("unchecked")
        List<String> courseCodes = (List<String>) request.get("courseCodes");
        String semester = (String) request.get("semester");
        String section = (String) request.get("section");
        List<EnrollmentDTO> enrollments = enrollmentService.registerCourses(student.getId(), courseCodes, semester, section);
        return ResponseEntity.ok(enrollments);
    }

    @PostMapping("/withdraw")
    public ResponseEntity<Map<String, String>> withdrawCourse(@RequestBody Map<String, Long> request) {
        enrollmentService.withdrawCourse(request.get("enrollmentId"));
        return ResponseEntity.ok(Map.of("message", "Course withdrawn successfully"));
    }
}
