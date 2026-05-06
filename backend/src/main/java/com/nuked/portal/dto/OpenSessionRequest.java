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

    /** Legacy — ignored on the pin-geolocation branch. Kept for backward compatibility. */
    private String bleDeviceName;

    /** Classroom location captured from the faculty's browser at open-time. */
    private Double latitude;
    private Double longitude;
}
