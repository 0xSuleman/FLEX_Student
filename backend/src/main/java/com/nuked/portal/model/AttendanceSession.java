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

    /**
     * Name of the BLE peripheral the teacher is broadcasting from (their phone
     * or a classroom beacon). Students must report the same name on their
     * mark request — backend rejects otherwise. Convention: FLEX-<anything>.
     */
    @Column(length = 64)
    private String bleDeviceName;

    /** Classroom lat/long captured when the teacher opened the session. */
    private Double latitude;
    private Double longitude;

    /** Max distance (meters) from the classroom for a mark to be accepted. */
    private Integer allowedRadiusMeters;
}
