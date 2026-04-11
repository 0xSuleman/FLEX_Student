package com.flex.student.controller;

import com.flex.student.dto.DashboardDTO;
import com.flex.student.service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final StudentService studentService;

    public DashboardController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<DashboardDTO> getDashboard(Authentication authentication) {
        String rollNo = authentication.getName();
        DashboardDTO dashboard = studentService.getDashboard(rollNo);
        return ResponseEntity.ok(dashboard);
    }
}
