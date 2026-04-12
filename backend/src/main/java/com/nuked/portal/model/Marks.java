package com.nuked.portal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "marks")
public class Marks {

    public enum EvaluationType {
        QUIZ, ASSIGNMENT, SESSIONAL_1, SESSIONAL_2, FINAL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id")
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
}
