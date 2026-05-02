package com.nuked.portal.service;

import com.nuked.portal.config.JwtUtil;
import com.nuked.portal.dto.StaffLoginRequest;
import com.nuked.portal.dto.StaffLoginResponse;
import com.nuked.portal.model.StaffUser;
import com.nuked.portal.repository.StaffUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StaffUserAuthService {

    private final StaffUserRepository staffUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public StaffLoginResponse login(StaffLoginRequest req, String roleEnumKey) {
        StaffUser user = staffUserRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!user.getRole().equalsIgnoreCase(roleEnumKey)) {
            throw new RuntimeException("This account is not authorised for role: " + roleEnumKey);
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getUsername(), roleEnumKey);
        return new StaffLoginResponse(
                token,
                user.getUsername(),
                user.getName(),
                roleEnumKey,
                user.getDesignation(),
                user.getDepartment(),
                user.getEmployeeId(),
                user.getCampus());
    }
}
