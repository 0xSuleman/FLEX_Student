package com.nuked.portal.service;

import com.nuked.portal.model.CourseFeedback;
import com.nuked.portal.repository.CourseFeedbackRepository;
import com.nuked.portal.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final CourseFeedbackRepository courseFeedbackRepository;
    private final EnrollmentRepository enrollmentRepository;

    public List<CourseFeedback> getFeedbacks(Long studentId) {
        return courseFeedbackRepository.findByEnrollmentStudentId(studentId);
    }

    public CourseFeedback submitFeedbackByCourseCode(Long studentId, String courseCode, Integer rating, String comments) {
        List<CourseFeedback> feedbacks = courseFeedbackRepository.findByEnrollmentStudentId(studentId);

        CourseFeedback feedback = feedbacks.stream()
                .filter(fb -> fb.getEnrollment().getCourse().getCode().equals(courseCode))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Feedback not found for course: " + courseCode));

        feedback.setStatus(CourseFeedback.FeedbackStatus.SUBMITTED);
        feedback.setRating(rating);
        feedback.setComments(comments);
        feedback.setSubmittedDate(LocalDate.now());

        return courseFeedbackRepository.save(feedback);
    }
}
