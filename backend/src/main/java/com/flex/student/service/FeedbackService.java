package com.flex.student.service;

import com.flex.student.model.CourseFeedback;
import com.flex.student.repository.CourseFeedbackRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class FeedbackService {

    private final CourseFeedbackRepository courseFeedbackRepository;

    public FeedbackService(CourseFeedbackRepository courseFeedbackRepository) {
        this.courseFeedbackRepository = courseFeedbackRepository;
    }

    public List<CourseFeedback> getFeedbacks(Long studentId) {
        return courseFeedbackRepository.findByEnrollmentStudentId(studentId);
    }

    public CourseFeedback submitFeedback(Long feedbackId, Integer rating, String comments) {
        CourseFeedback feedback = courseFeedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        feedback.setStatus(CourseFeedback.FeedbackStatus.SUBMITTED);
        feedback.setRating(rating);
        feedback.setComments(comments);
        feedback.setSubmittedDate(LocalDate.now());

        return courseFeedbackRepository.save(feedback);
    }
}
