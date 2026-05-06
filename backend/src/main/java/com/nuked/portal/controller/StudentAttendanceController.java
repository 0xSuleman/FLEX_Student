package com.nuked.portal.controller;

import com.nuked.portal.dto.MarkAttendanceRequest;
import com.nuked.portal.dto.OpenSessionForStudentDTO;
import com.nuked.portal.service.StudentAttendanceService;
import jakarta.servlet.http.HttpServletRequest;
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
                                                        HttpServletRequest http,
                                                        @Valid @RequestBody MarkAttendanceRequest req) {
        return ResponseEntity.ok(service.markPresent(
                auth.getName(),
                req.getSessionId(),
                req.getPinCode(),
                req.getLatitude(),
                req.getLongitude(),
                req.getDeviceUuid(),
                resolveClientIp(http)));
    }

    /**
     * Behind a Cloudflare tunnel / nginx the raw remoteAddr is the proxy.
     * Honour the standard X-Forwarded-For chain (first hop = real client),
     * fall back to remoteAddr.
     */
    private static String resolveClientIp(HttpServletRequest http) {
        String xff = http.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int comma = xff.indexOf(',');
            return (comma > 0 ? xff.substring(0, comma) : xff).trim();
        }
        return http.getRemoteAddr();
    }
}
