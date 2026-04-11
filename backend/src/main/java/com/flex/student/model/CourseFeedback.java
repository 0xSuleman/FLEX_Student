package com.flex.student.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "course_feedback")
public class CourseFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private Enrollment enrollment;

    @Enumerated(EnumType.STRING)
    private FeedbackStatus status;

    private LocalDate submittedDate;

    private Integer rating;

    @Column(length = 2000)
    private String comments;

    public enum FeedbackStatus {
        PENDING, SUBMITTED
    }
}
