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
     * Legacy: BLE peripheral name from the bluetooth-attendance demo path.
     * Unused on the pin-geolocation branch but kept so old sessions still
     * deserialize. Always null for new sessions.
     */
    @Column(length = 64)
    private String bleDeviceName;

    /**
     * 6-digit numeric PIN generated when the session is opened. Teacher
     * announces / projects it; students enter it to mark attendance.
     * Combined with the geolocation gate below this is a universal-browser
     * proximity check (works on iPhone Safari, no Bluetooth needed).
     */
    @Column(length = 6)
    private String pinCode;

    /** Classroom lat/long captured when the teacher opened the session. */
    private Double latitude;
    private Double longitude;

    /** Max distance (meters) from the classroom for a mark to be accepted. */
    private Integer allowedRadiusMeters;
}
