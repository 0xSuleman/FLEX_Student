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
@Table(name = "fee_challans")
public class FeeChallan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    private String semester;

    @Column(unique = true)
    private String challanNo;

    private Double amount;

    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    private ChallanStatus status;

    private LocalDate generatedDate;

    private LocalDate paidDate;

    public enum ChallanStatus {
        PAID, UNPAID
    }
}
