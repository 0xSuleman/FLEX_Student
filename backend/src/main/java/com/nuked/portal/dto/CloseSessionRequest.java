package com.nuked.portal.dto;

import lombok.Data;

import java.util.List;

@Data
public class CloseSessionRequest {

    private List<MarkEntry> marks;

    @Data
    public static class MarkEntry {
        private Long enrollmentId;
        private String presence; // "P" | "A" | "L"
        private String method;   // "Automated" | "Manual" | "Auto"
    }
}
