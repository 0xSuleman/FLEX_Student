package com.nuked.portal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private final JwtAuthFilter jwtAuthFilter;
    public SecurityConfig(JwtAuthFilter jwtAuthFilter) { this.jwtAuthFilter = jwtAuthFilter; }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/faculty/**").hasRole("FACULTY")
                .requestMatchers("/api/hod/**").hasRole("HOD")
                .requestMatchers("/api/ao/**").hasAnyRole("AO", "ASST_AO", "MANAGER", "ASST_MANAGER")
                .requestMatchers("/api/exam/**").hasRole("EXAM_OFFICE")
                .requestMatchers("/api/finance/**").hasRole("FINANCE")
                .requestMatchers("/api/it/**").hasRole("IT_ADMIN")
                .requestMatchers("/api/registrar/**").hasRole("REGISTRAR")
                .requestMatchers("/api/admissions/**").hasRole("ADMISSIONS")
                .requestMatchers("/api/cao/**").hasRole("CAO")
                .anyRequest().authenticated())
            // JSON error bodies for filter-level rejections (missing/invalid
            // JWT, role mismatch). Without this Spring sends an empty body
            // and axios falls back to "Request failed with status code 401".
            .exceptionHandling(eh -> eh
                .authenticationEntryPoint((req, res, ex) -> writeJson(res,
                        HttpServletResponse.SC_UNAUTHORIZED,
                        "Your session has expired or no token was sent. Sign in again."))
                .accessDeniedHandler((req, res, ex) -> writeJson(res,
                        HttpServletResponse.SC_FORBIDDEN,
                        "You don't have permission to perform this action.")))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private static void writeJson(HttpServletResponse res, int status, String message) throws IOException {
        res.setStatus(status);
        res.setContentType("application/json");
        // Hand-rolled JSON to avoid pulling in a serializer here. Keep keys
        // identical to GlobalExceptionHandler so frontend extraction is one path.
        String safe = message.replace("\\", "\\\\").replace("\"", "\\\"");
        res.getWriter().write(String.format(
                "{\"message\":\"%s\",\"status\":%d,\"timestamp\":\"%s\"}",
                safe, status, Instant.now().toString()));
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Local dev + Cloudflare/ngrok tunnels (so phones hitting the demo
        // URL aren't blocked) + LAN ranges (RFC1918) for direct WiFi access.
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://*.trycloudflare.com",
                "https://*.ngrok-free.app",
                "https://*.ngrok.io",
                "http://192.168.*.*:*",
                "http://10.*.*.*:*",
                "http://172.16.*.*:*",
                "http://172.17.*.*:*",
                "http://172.18.*.*:*",
                "http://172.19.*.*:*",
                "http://172.2*.*.*:*",
                "http://172.30.*.*:*",
                "http://172.31.*.*:*"
        ));
        config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
    @Bean public AuthenticationManager authenticationManager(AuthenticationConfiguration c) throws Exception { return c.getAuthenticationManager(); }
}
