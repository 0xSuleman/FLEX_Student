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
}
