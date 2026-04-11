package com.flex.student.service;

import com.flex.student.config.JwtUtil;
import com.flex.student.dto.LoginRequest;
import com.flex.student.dto.LoginResponse;
import com.flex.student.model.Student;
import com.flex.student.repository.StudentRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(StudentRepository studentRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public LoginResponse login(LoginRequest request) {
        Student student = studentRepository.findByRollNo(request.getRollNo())
                .orElseThrow(() -> new RuntimeException("Invalid roll number or password"));

        if (!passwordEncoder.matches(request.getPassword(), student.getPassword())) {
            throw new RuntimeException("Invalid roll number or password");
        }

        String token = jwtUtil.generateToken(student.getRollNo());
        return new LoginResponse(token, student.getRollNo(), student.getName());
    }
}
