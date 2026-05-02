package com.nuked.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StaffLoginResponse {
    private String token;
    private String username;
    private String name;
    private String role;
    private String designation;
    private String department;
    private String employeeId;
    private String campus;
}
