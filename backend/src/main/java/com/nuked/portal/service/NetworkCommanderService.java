package com.nuked.portal.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nuked.portal.dto.AttendanceSessionDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NetworkCommanderService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .version(HttpClient.Version.HTTP_1_1)
            .build();

    @Value("${captive.commander-url:http://127.0.0.1}")
    private String commanderUrl;

    @Value("${captive.backend-url:http://127.0.0.1:8090}")
    private String backendUrl;

    @Value("${captive.commander-secret:dev-captive-secret}")
    private String commanderSecret;

    public Map<String, Object> start(AttendanceSessionDTO session) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sessionId", session.getId());
        payload.put("courseCode", session.getCourseCode());
        payload.put("section", session.getSection());
        payload.put("topic", session.getTopic());
        payload.put("endsAt", session.getEndsAt() == null ? null : session.getEndsAt().toString());
        payload.put("backendBaseUrl", backendUrl);
        return exchange("POST", "/control/start", payload);
    }

    public Map<String, Object> stop(Long sessionId) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sessionId", sessionId);
        return exchange("POST", "/control/stop", payload);
    }

    public Map<String, Object> status() {
        return exchange("GET", "/control/status", null);
    }

    private Map<String, Object> exchange(String method, String path, Map<String, Object> payload) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder(uri(path))
                    .timeout(Duration.ofSeconds(10))
                    .header("X-Captive-Secret", commanderSecret);
            if ("GET".equals(method)) {
                builder.GET();
            } else {
                String json = objectMapper.writeValueAsString(payload == null ? Map.of() : payload);
                builder.header("Content-Type", "application/json")
                        .method(method, HttpRequest.BodyPublishers.ofString(json));
            }
            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new RuntimeException("Network commander error: " + messageFrom(response.body()));
            }
            if (response.body() == null || response.body().isBlank()) return Map.of("ok", true);
            return objectMapper.readValue(response.body(), new TypeReference<>() {});
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Network commander is not reachable at " + commanderUrl + ": " + e.getMessage());
        }
    }

    private URI uri(String path) {
        String base = commanderUrl == null || commanderUrl.isBlank() ? "http://127.0.0.1" : commanderUrl.trim();
        while (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        return URI.create(base + path);
    }

    private String messageFrom(String body) {
        if (body == null || body.isBlank()) return "empty response";
        try {
            Map<String, Object> parsed = objectMapper.readValue(body, new TypeReference<>() {});
            Object detail = parsed.get("detail");
            if (detail != null) return String.valueOf(detail);
            Object message = parsed.get("message");
            if (message != null) return String.valueOf(message);
        } catch (Exception ignored) {
        }
        return body;
    }
}
