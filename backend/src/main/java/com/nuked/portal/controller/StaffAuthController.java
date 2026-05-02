package com.nuked.portal.controller;

import com.nuked.portal.dto.StaffLoginRequest;
import com.nuked.portal.dto.StaffLoginResponse;
import com.nuked.portal.service.FacultyAuthService;
import com.nuked.portal.service.StaffUserAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class StaffAuthController {

    private final FacultyAuthService facultyAuthService;
    private final StaffUserAuthService staffUserAuthService;

    /**
     * Maps the role values used by the frontend (lowercase, snake_case) to the
     * canonical UPPER_CASE enum keys used by JWT and DB.
     */
    private static final Set<String> KNOWN_ROLES = Set.of(
            "FACULTY",
            "HOD",
            "AO",
            "ASST_AO",
            "MANAGER",
            "ASST_MANAGER",
            "EXAM_OFFICE",
            "FINANCE",
            "IT_ADMIN",
            "REGISTRAR",
            "ADMISSIONS",
            "CAO");

    @PostMapping("/staff-login")
    public ResponseEntity<StaffLoginResponse> staffLogin(@Valid @RequestBody StaffLoginRequest req) {
        String role = (req.getRole() == null ? "faculty" : req.getRole()).toUpperCase();
        if (!KNOWN_ROLES.contains(role)) {
            throw new RuntimeException("Unknown role: " + role);
        }
        if ("FACULTY".equals(role)) {
            return ResponseEntity.ok(facultyAuthService.login(req));
        }
        return ResponseEntity.ok(staffUserAuthService.login(req, role));
    }
}
