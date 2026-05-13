package com.nuked.portal.controller;

import com.nuked.portal.dto.CaptiveAttendanceResponse;
import com.nuked.portal.dto.CaptiveMarkRequest;
import com.nuked.portal.service.StudentAttendanceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;

@RestController
@RequestMapping("/api/captive/attendance")
@RequiredArgsConstructor
public class CaptiveAttendanceController {

    private final StudentAttendanceService service;

    @Value("${captive.commander-secret:dev-captive-secret}")
    private String commanderSecret;

    @PostMapping("/mark")
    public ResponseEntity<CaptiveAttendanceResponse> mark(HttpServletRequest http,
                                                          @RequestHeader(value = "X-Captive-Secret", required = false) String secret,
                                                          @Valid @RequestBody CaptiveMarkRequest req) {
        if (!Objects.equals(commanderSecret, secret)) {
            throw new AccessDeniedException("Captive commander secret is invalid.");
        }
        String clientIp = req.getClientIp();
        if (clientIp == null || clientIp.isBlank()) {
            clientIp = resolveClientIp(http);
        }
        return ResponseEntity.ok(service.markPresentCaptive(
                req.getRollNo(),
                req.getSessionId(),
                req.getDeviceUuid(),
                clientIp,
                req.getClientFingerprint(),
                req.getClientMac()));
    }

    private static String resolveClientIp(HttpServletRequest http) {
        String xff = http.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int comma = xff.indexOf(',');
            return (comma > 0 ? xff.substring(0, comma) : xff).trim();
        }
        return http.getRemoteAddr();
    }
}
