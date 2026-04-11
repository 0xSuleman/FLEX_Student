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
@Table(name = "course_withdraw_requests")
public class CourseWithdrawRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private Enrollment enrollment;

    private String documentPath;

    @Enumerated(EnumType.STRING)
    private RetakeExamRequest.RequestStatus status;

    private LocalDate requestDate;
}
