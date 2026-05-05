package com.nuked.portal.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OpenSessionRequest {

    @NotNull
    private Long facultySectionId;

    private String topic;

    @Min(5)
    private Integer durationMinutes;

    /**
     * Name the teacher's phone / classroom BLE beacon is advertising with —
     * e.g. "FLEX-CS3001-A". Students must report the same name on their mark
     * request, which is how proximity is verified.
     */
    private String bleDeviceName;

    /** Classroom location captured from the faculty's browser at open-time. */
    private Double latitude;
    private Double longitude;
}
