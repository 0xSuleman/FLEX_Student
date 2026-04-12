package com.nuked.portal.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class StudentProfileDTO {
    private Long id;
    private String rollNo;
    private String name;
    private String gender;
    private String email;
    private LocalDate dob;
    private String cnic;
    private String mobileNo;
    private String bloodGroup;
    private String nationality;
    private String degree;
    private String batch;
    private String section;
    private String campus;
    private String status;
    private String profileImageUrl;
}
