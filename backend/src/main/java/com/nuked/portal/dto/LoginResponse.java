package com.nuked.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String rollNumber;
    private String name;
    private String section;
    private String degree;
    private String campus;
}
