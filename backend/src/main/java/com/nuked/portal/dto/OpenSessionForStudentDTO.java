package com.nuked.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class OpenSessionForStudentDTO {
    private Long sessionId;
    private Long enrollmentId;
    private String courseCode;
    private String courseName;
    private String section;
    private String topic;
    private LocalDate lectureDate;
    private Instant startedAt;
    private Instant endsAt;
    private String sessionToken;
    private boolean alreadyMarked;
    private String bleDeviceName;
}
