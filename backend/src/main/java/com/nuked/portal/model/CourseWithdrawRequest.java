package com.nuked.portal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "course_withdraw_requests")
public class CourseWithdrawRequest {

    public enum WithdrawState {
        PENDING_FACULTY,        // submitted by student, awaiting faculty recommendation
        PENDING_HOD,            // faculty recommended approve, HOD final decision
        APPROVED,
        REJECTED                // by faculty or HOD; reason in remarks
    }

    public enum FacultyRecommendation { APPROVE, REJECT }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "enrollment_id")
    private Enrollment enrollment;

    private String documentPath;

    /** Legacy status — kept for backward compat with old seed code. */
    @Enumerated(EnumType.STRING)
    private RetakeExamRequest.RequestStatus status;

    @Enumerated(EnumType.STRING)
    private WithdrawState state;

    @Enumerated(EnumType.STRING)
    private FacultyRecommendation facultyRecommendation;

    @Column(length = 1000)
    private String facultyRemarks;

    @Column(length = 1000)
    private String hodRemarks;

    private LocalDate requestDate;
    private java.time.LocalDateTime facultyActedAt;
    private java.time.LocalDateTime hodActedAt;
}
