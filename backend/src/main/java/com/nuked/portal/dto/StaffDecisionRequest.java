package com.nuked.portal.dto;

import lombok.Data;

@Data
public class StaffDecisionRequest {
    private String action;        // APPROVE / REJECT
    private String remarks;
}
