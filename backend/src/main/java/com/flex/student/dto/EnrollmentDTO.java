package com.flex.student.dto;

import lombok.Data;

@Data
public class EnrollmentDTO {
    private Long id;
    private String courseCode;
    private String courseName;
    private Integer creditHours;
    private String courseType;
    private String semester;
    private String section;
    private String grade;
    private Double points;
    private String remarks;
    private String status;
}
