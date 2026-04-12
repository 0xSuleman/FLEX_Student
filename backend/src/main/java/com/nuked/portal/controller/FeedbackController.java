package com.nuked.portal.controller;

import com.nuked.portal.model.CourseFeedback;
import com.nuked.portal.model.Enrollment;
import com.nuked.portal.model.Student;
import com.nuked.portal.repository.CourseFeedbackRepository;
import com.nuked.portal.repository.EnrollmentRepository;
import com.nuked.portal.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final CourseFeedbackRepository feedbackRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getFeedbacks(Authentication auth) {
        Student student = studentService.findByRollNo(auth.getName());
        List<CourseFeedback> feedbacks = feedbackRepository.findByEnrollmentStudentId(student.getId());

        List<Map<String, Object>> result = feedbacks.stream().map(f -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", f.getId());
            map.put("courseCode", f.getEnrollment().getCourse().getCode());
            map.put("courseName", f.getEnrollment().getCourse().getName());
            map.put("creditHours", f.getEnrollment().getCourse().getCreditHours());
            map.put("status", f.getStatus() != null ? f.getStatus().name() : null);
            map.put("submittedDate", f.getSubmittedDate() != null ? f.getSubmittedDate().toString() : null);
            map.put("rating", f.getRating());
            map.put("comments", f.getComments());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, String>> submitFeedback(
            Authentication auth,
            @RequestBody Map<String, Object> request) {
        Student student = studentService.findByRollNo(auth.getName());

        String courseCode = (String) request.get("courseCode");
        String comments = (String) request.get("comments");

        // Find the enrollment for this course
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());
        Enrollment enrollment = enrollments.stream()
                .filter(e -> e.getCourse().getCode().equals(courseCode))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Enrollment not found for course: " + courseCode));

        // Find existing feedback or create new
        List<CourseFeedback> feedbacks = feedbackRepository.findByEnrollmentStudentId(student.getId());
        CourseFeedback feedback = feedbacks.stream()
                .filter(f -> f.getEnrollment().getId().equals(enrollment.getId()))
                .findFirst()
                .orElse(new CourseFeedback());

        feedback.setEnrollment(enrollment);
        feedback.setStatus(CourseFeedback.FeedbackStatus.SUBMITTED);
        feedback.setSubmittedDate(LocalDate.now());
        feedback.setComments(comments);

        // Calculate average rating from the ratings map
        Map<String, Object> ratings = (Map<String, Object>) request.get("ratings");
        if (ratings != null && !ratings.isEmpty()) {
            int total = 0;
            int count = 0;
            for (Object val : ratings.values()) {
                if (val instanceof Number) {
                    total += ((Number) val).intValue();
                    count++;
                }
            }
            if (count > 0) {
                feedback.setRating(total / count);
            }
        }

        feedbackRepository.save(feedback);

        return ResponseEntity.ok(Map.of("message", "Feedback submitted successfully"));
    }
}
