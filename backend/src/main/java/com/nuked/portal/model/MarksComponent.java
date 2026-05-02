package com.nuked.portal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "marks_components")
public class MarksComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instrument_id", nullable = false)
    private MarksInstrument instrument;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private double maxMarks;

    @Column(nullable = false)
    private double weightage;

    @Column(nullable = false)
    private int displayOrder;
}
