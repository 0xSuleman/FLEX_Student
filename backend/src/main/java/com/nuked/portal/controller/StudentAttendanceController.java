package com.nuked.portal.controller;

import com.nuked.portal.dto.MarkAttendanceRequest;
import com.nuked.portal.dto.OpenSessionForStudentDTO;
import com.nuked.portal.service.StudentAttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/attendance")
@RequiredArgsConstructor
public class StudentAttendanceController {

    private final StudentAttendanceService service;

    @GetMapping("/open-sessions")
    public ResponseEntity<List<OpenSessionForStudentDTO>> openSessions(Authentication auth) {
        return ResponseEntity.ok(service.openSessionsForStudent(auth.getName()));
    }

    @PostMapping("/mark")
    public ResponseEntity<OpenSessionForStudentDTO> mark(Authentication auth,
                                                        @Valid @RequestBody MarkAttendanceRequest req) {
        return ResponseEntity.ok(service.markPresent(
                auth.getName(),
                req.getSessionId(),
                req.getBleDeviceName(),
                req.getLatitude(),
                req.getLongitude()));
    }
}
