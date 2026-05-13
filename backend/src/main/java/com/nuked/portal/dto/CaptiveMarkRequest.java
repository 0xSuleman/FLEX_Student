package com.nuked.portal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CaptiveMarkRequest {
    @NotNull
    private Long sessionId;

    private String rollNo;
    private String deviceUuid;
    private String clientFingerprint;
    private String clientIp;
    private String clientMac;
}
