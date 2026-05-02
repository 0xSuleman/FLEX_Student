package com.nuked.portal.service;

import com.nuked.portal.config.JwtUtil;
import com.nuked.portal.dto.LoginRequest;
import com.nuked.portal.dto.LoginResponse;
import com.nuked.portal.model.Student;
import com.nuked.portal.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        Student student = studentRepository.findByRollNo(request.getRollNumber())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), student.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(student.getRollNo(), "STUDENT");
        return new LoginResponse(token, student.getRollNo(), student.getName(), student.getSection(), student.getDegree(), student.getCampus());
    }
}
