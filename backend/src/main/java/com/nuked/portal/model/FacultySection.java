package com.nuked.portal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "faculty_sections", uniqueConstraints =
    @UniqueConstraint(columnNames = {"faculty_id", "course_id", "section", "semester"}))
public class FacultySection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false)
    private String section;

    @Column(nullable = false)
    private String semester;

    private String room;

    private String dayPattern; // e.g. "Mon/Wed"

    private String timeSlot;   // e.g. "10:00-11:30"
}
