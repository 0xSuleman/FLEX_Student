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

    /** "AUTOMATED" or "MANUAL". Defaults to automated when omitted. */
    private String mode;
}
