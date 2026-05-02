package com.nuked.portal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "grade_submissions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"faculty_section_id"}))
public class GradeSubmission {

    public enum Scheme { ABSOLUTE, RELATIVE }

    public enum State {
        DRAFT,        // faculty still working
        SUBMITTED,    // awaiting HOD action
        APPROVED,     // HOD approved — finals + final grade visible to students
        REJECTED      // HOD rejected — faculty can edit and resubmit
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_section_id", nullable = false, unique = true)
    private FacultySection facultySection;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Scheme scheme = Scheme.ABSOLUTE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private State state = State.DRAFT;

    private LocalDateTime submittedAt;
    private LocalDateTime decidedAt;

    @Column(length = 1000)
    private String hodRemarks;
}
