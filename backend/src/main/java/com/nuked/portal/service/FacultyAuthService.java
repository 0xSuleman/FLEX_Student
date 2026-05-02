package com.nuked.portal.service;

import com.nuked.portal.config.JwtUtil;
import com.nuked.portal.dto.StaffLoginRequest;
import com.nuked.portal.dto.StaffLoginResponse;
import com.nuked.portal.model.Faculty;
import com.nuked.portal.repository.FacultyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FacultyAuthService {

    private final FacultyRepository facultyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public StaffLoginResponse login(StaffLoginRequest req) {
        Faculty fac = facultyRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(req.getPassword(), fac.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(fac.getUsername(), "FACULTY");
        return new StaffLoginResponse(
                token,
                fac.getUsername(),
                fac.getName(),
                "FACULTY",
                fac.getDesignation(),
                fac.getDepartment(),
                fac.getEmployeeId(),
                fac.getCampus());
    }
}
