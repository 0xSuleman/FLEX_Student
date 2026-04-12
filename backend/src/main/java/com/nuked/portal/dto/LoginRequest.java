package com.nuked.portal.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank
    private String rollNumber;

    @NotBlank
    private String password;
}
