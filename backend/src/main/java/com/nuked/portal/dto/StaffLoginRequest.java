package com.nuked.portal.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StaffLoginRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    /** "faculty", "hod", "ao", "exam_office", "finance", "it_admin", etc. */
    private String role;
}
