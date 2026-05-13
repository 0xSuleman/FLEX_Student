package com.nuked.portal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "attendance_sessions")
public class AttendanceSession {

    public enum Status { OPEN, CLOSED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_section_id", nullable = false)
    private FacultySection facultySection;

    @Column(nullable = false)
    private LocalDate lectureDate;

    private Integer lectureNo;

    private String topic;

    @Column(unique = true, nullable = false)
    private String sessionToken;

    @Column(nullable = false)
    private Instant startedAt;

    @Column(nullable = false)
    private Instant endsAt;

    private Instant closedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.OPEN;

    private Integer durationMinutes;

    @Column(length = 16)
    private String mode;
}
