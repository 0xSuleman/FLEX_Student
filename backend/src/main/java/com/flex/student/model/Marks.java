package com.flex.student.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "marks")
public class Marks {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private Enrollment enrollment;

    @Enumerated(EnumType.STRING)
    private EvaluationType evaluationType;

    private String evaluationName;

    private Double weightage;

    private Double obtained;

    private Double total;

    private Double average;

    private Double stdDev;

    private Double min;

    private Double max;

    public enum EvaluationType {
        QUIZ, ASSIGNMENT, SESSIONAL, MIDTERM, FINAL
    }
}
