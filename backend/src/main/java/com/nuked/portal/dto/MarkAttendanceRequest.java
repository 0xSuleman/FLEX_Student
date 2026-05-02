package com.nuked.portal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MarkAttendanceRequest {

    @NotNull
    private Long sessionId;

    /** Optional — token shown on the faculty BLE beacon. We accept it but don't strictly require it for the demo. */
    private String sessionToken;

    /**
     * Name of the BLE peripheral the student's browser connected to. Must
     * equal the session's recorded `bleDeviceName` — otherwise the mark is
     * rejected (proves the student is in range of the teacher's device).
     */
    private String bleDeviceName;
}
