package com.nuked.portal.dto;

import lombok.Data;

@Data
public class GradeRowDTO {
    private Long enrollmentId;
    private String rollNo;
    private String name;
    private Double percentage;       // 0–100, weighted across all instruments
    private String letterGrade;
    private Double gradePoints;
    private String reason;           // e.g. "missing scores" → grade is null/IP
}
