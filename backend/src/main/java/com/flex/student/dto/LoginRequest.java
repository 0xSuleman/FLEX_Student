package com.flex.student.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    private String rollNo;
    @NotBlank
    private String password;
}
