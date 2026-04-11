package com.flex.student.controller;

import com.flex.student.dto.EnrollmentDTO;
import com.flex.student.model.Student;
import com.flex.student.service.EnrollmentService;
import com.flex.student.service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/grade-report")
public class GradeReportController {

    private final EnrollmentService enrollmentService;
    private final StudentService studentService;

    public GradeReportController(EnrollmentService enrollmentService, StudentService studentService) {
        this.enrollmentService = enrollmentService;
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getGradeReport(Authentication authentication) {
        Student student = studentService.findByRollNo(authentication.getName());
        List<EnrollmentDTO> allEnrollments = enrollmentService.getEnrollments(student.getId(), null);

        Map<String, List<EnrollmentDTO>> bySemester = allEnrollments.stream()
                .collect(Collectors.groupingBy(EnrollmentDTO::getSemester, LinkedHashMap::new, Collectors.toList()));

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("studentName", student.getName());
        report.put("rollNo", student.getRollNo());
        report.put("degree", student.getDegree());
        report.put("semesters", bySemester);

        return ResponseEntity.ok(report);
    }
}
