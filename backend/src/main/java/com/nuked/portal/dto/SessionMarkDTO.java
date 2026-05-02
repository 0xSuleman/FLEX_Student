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
    private String method;     // "Bluetooth" | "Manual" | "Auto"
    private String markedAt;   // ISO string or null
}
