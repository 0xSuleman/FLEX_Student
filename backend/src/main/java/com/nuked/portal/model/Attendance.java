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

    /** "Automated" | "Manual" | "Auto" — source that produced this mark. */
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

    /**
     * Physical device address observed from the captive hotspot ARP table.
     * This is the strongest automated attendance signal: one MAC cannot mark attendance
     * for multiple enrollments in the same live session.
     */
    @Column(name = "client_mac", length = 32)
    private String clientMac;

    /**
     * Cross-browser device signature: screen dimensions + language + timezone,
     * computed by the student's browser. Stable across different browsers on
     * the same physical device, so two marks in one session with identical
     * fingerprints but different deviceUuids = same phone via different
     * browsers (probable cheat). NOT used for auto-reject — surfaced to
     * faculty as a review flag because two students with literally identical
     * phones can collide.
     */
    @Column(name = "client_fingerprint", length = 256)
    private String clientFingerprint;
}
