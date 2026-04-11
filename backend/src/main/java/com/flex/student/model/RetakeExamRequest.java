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
@Table(name = "retake_exam_requests")
public class RetakeExamRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private Enrollment enrollment;

    @Enumerated(EnumType.STRING)
    private Marks.EvaluationType evaluationType;

    @Column(length = 1000)
    private String reason;

    private String documentPath;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    private LocalDate requestDate;

    public enum RequestStatus {
        PENDING, APPROVED, REJECTED
    }
}
