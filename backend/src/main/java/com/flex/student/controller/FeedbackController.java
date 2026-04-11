package com.flex.student.controller;

import com.flex.student.model.CourseFeedback;
import com.flex.student.model.Student;
import com.flex.student.service.FeedbackService;
import com.flex.student.service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final StudentService studentService;

    public FeedbackController(FeedbackService feedbackService, StudentService studentService) {
        this.feedbackService = feedbackService;
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<List<CourseFeedback>> getFeedbacks(Authentication authentication) {
        Student student = studentService.findByRollNo(authentication.getName());
        List<CourseFeedback> feedbacks = feedbackService.getFeedbacks(student.getId());
        return ResponseEntity.ok(feedbacks);
    }

    @PostMapping("/{id}")
    public ResponseEntity<CourseFeedback> submitFeedback(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        Integer rating = (Integer) request.get("rating");
        String comments = (String) request.get("comments");
        CourseFeedback feedback = feedbackService.submitFeedback(id, rating, comments);
        return ResponseEntity.ok(feedback);
    }
}
