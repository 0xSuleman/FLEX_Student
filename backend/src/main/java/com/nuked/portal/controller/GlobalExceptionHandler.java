package com.nuked.portal.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Catches every uncaught exception thrown from a controller / service and
 * returns a JSON body the frontend can display:
 *   { "message": "Wrong PIN — ...", "status": 400, "timestamp": "..." }
 *
 * Without this, Spring returns blank-body 403/500s and the user just sees
 * axios's default "Request failed with status code 403", which is useless.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> accessDenied(AccessDeniedException ex) {
        return body(HttpStatus.FORBIDDEN, ex.getMessage() != null ? ex.getMessage()
                : "You don't have permission to perform this action.");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> authFailed(AuthenticationException ex) {
        return body(HttpStatus.UNAUTHORIZED, ex.getMessage() != null ? ex.getMessage()
                : "Authentication failed — please sign in again.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> badRequest(IllegalArgumentException ex) {
        return body(HttpStatus.BAD_REQUEST, ex.getMessage() != null ? ex.getMessage()
                : "Invalid request.");
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> conflict(IllegalStateException ex) {
        return body(HttpStatus.CONFLICT, ex.getMessage() != null ? ex.getMessage()
                : "Operation not allowed in current state.");
    }

    /**
     * Bean validation (`@Valid` + constraints like `@NotNull`) — collect every
     * failed field name + message into a single readable string.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        if (detail.isEmpty()) detail = "Request validation failed.";
        return body(HttpStatus.BAD_REQUEST, detail);
    }

    /**
     * RuntimeException is what most of the codebase uses for domain errors
     * (wrong PIN, out of range, expired session, etc). Treat as 400 so the
     * frontend gets the real message instead of a blank 500.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> runtime(RuntimeException ex) {
        // Don't shadow more-specific Spring runtime exceptions handled above.
        if (ex instanceof AccessDeniedException) return accessDenied((AccessDeniedException) ex);
        if (ex instanceof AuthenticationException) return authFailed((AuthenticationException) ex);
        if (ex instanceof IllegalArgumentException) return badRequest((IllegalArgumentException) ex);
        if (ex instanceof IllegalStateException) return conflict((IllegalStateException) ex);
        return body(HttpStatus.BAD_REQUEST, ex.getMessage() != null ? ex.getMessage()
                : "Operation failed — try again.");
    }

    /** Catch-all so nothing leaves the server with a blank body. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> fallback(Exception ex) {
        String msg = ex.getMessage();
        if (msg == null || msg.isBlank()) msg = "Server error — please retry. If it persists, contact support.";
        return body(HttpStatus.INTERNAL_SERVER_ERROR, msg);
    }

    private static ResponseEntity<Map<String, Object>> body(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", message);
        body.put("status", status.value());
        body.put("timestamp", Instant.now().toString());
        return ResponseEntity.status(status).body(body);
    }
}
