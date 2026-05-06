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
@Table(name = "attendance")
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id")
    private Enrollment enrollment;

    private Integer lectureNo;

    private LocalDate date;

    private Double durationHrs;

    @Column(length = 2)
    private String presence;

    /** "Bluetooth" | "Manual" | "Auto" — populated when marked via a faculty BLE session. */
    @Column(length = 16)
    private String method;

    /** AttendanceSession id this entry came from (null for legacy / non-session marks). */
    @Column(name = "session_id")
    private Long sessionId;

    /**
     * Per-browser localStorage UUID sent by the student's device on each mark.
     * Used as a per-session lock: once a UUID has marked enrollment X in
     * session N, the same UUID cannot mark a different enrollment in the
     * same session — catches "log out, log in as friend" cheats.
     */
    @Column(name = "device_uuid", length = 64)
    private String deviceUuid;

    /**
     * Source IP recorded server-side at mark time. Not used for validation
     * (NAT makes it noisy) — purely for faculty audit / forensic review.
     */
    @Column(name = "client_ip", length = 64)
    private String clientIp;
}
