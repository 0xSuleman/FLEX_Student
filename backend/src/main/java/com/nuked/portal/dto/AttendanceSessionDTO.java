package com.nuked.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class AttendanceSessionDTO {
    private Long id;
    private Long facultySectionId;
    private String courseCode;
    private String section;
    private String semester;
    private LocalDate lectureDate;
    private Integer lectureNo;
    private String topic;
    private String sessionToken;
    private Instant startedAt;
    private Instant endsAt;
    private Instant closedAt;
    private String status;
    private Integer durationMinutes;
    private String bleDeviceName;
    private String pinCode;
}
