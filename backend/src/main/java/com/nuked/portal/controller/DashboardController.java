package com.nuked.portal.controller;

import com.nuked.portal.dto.DashboardDTO;
import com.nuked.portal.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<DashboardDTO> getDashboard(Authentication auth) {
        DashboardDTO dashboard = studentService.getDashboard(auth.getName());
        return ResponseEntity.ok(dashboard);
    }
}
