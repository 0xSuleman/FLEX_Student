package com.nuked.portal.dto;

import lombok.Data;

@Data
public class RetakeRequestDTO {
    private Long id;
    private Long enrollmentId;
    private String studentRollNo;
    private String studentName;
    private String courseCode;
    private String courseName;
    private String section;
    private String semester;
    private String evaluationType;
    private String reason;
    private String status;            // PENDING / APPROVED / REJECTED
    private String hodRemarks;
    private String requestDate;
    private String documentPath;
}
