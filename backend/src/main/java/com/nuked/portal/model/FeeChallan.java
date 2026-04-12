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
@Table(name = "fee_challans")
public class FeeChallan {

    public enum ChallanStatus {
        PAID, UNPAID
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
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
}
