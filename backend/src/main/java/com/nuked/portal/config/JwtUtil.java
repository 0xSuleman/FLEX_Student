package com.nuked.portal.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {
    @Value("${jwt.secret}") private String secret;
    @Value("${jwt.expiration}") private long expiration;

    private SecretKey getSigningKey() { return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); }

    /** Backward-compatible: existing student auth path. */
    public String generateToken(String rollNo) {
        return generateToken(rollNo, "STUDENT");
    }

    public String generateToken(String subject, String role) {
        return Jwts.builder()
                .subject(subject)
                .claims(Map.of("role", role == null ? "STUDENT" : role.toUpperCase()))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractSubject(String token) { return getClaims(token).getSubject(); }

    /** Kept for older callers. */
    public String extractRollNo(String token) { return extractSubject(token); }

    public String extractRole(String token) {
        Object r = getClaims(token).get("role");
        return r == null ? "STUDENT" : r.toString();
    }

    public boolean validateToken(String token) {
        try { getClaims(token); return true; } catch (Exception e) { return false; }
    }

    private Claims getClaims(String token) {
        return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
    }
}
