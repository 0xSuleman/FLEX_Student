package com.nuked.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SessionMarkDTO {
    private Long enrollmentId;
    private String rollNo;
    private String name;
    private String presence;   // "P" | "A" | "L"
    private String method;     // "PIN" | "Bluetooth" | "Manual" | "Auto"
    private String markedAt;   // ISO string or null
    private String deviceUuid; // student's localStorage UUID, null if not provided
    private String clientIp;   // source IP (for faculty audit)
    private String clientFingerprint; // screen+lang+tz signature for cross-browser flag
}
