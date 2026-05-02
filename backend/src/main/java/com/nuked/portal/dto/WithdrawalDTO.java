package com.nuked.portal.dto;

import lombok.Data;

@Data
public class WithdrawalDTO {
    private Long id;
    private Long enrollmentId;
    private String studentRollNo;
    private String studentName;
    private String courseCode;
    private String courseName;
    private String section;
    private String semester;
    private String state;                    // PENDING_FACULTY / PENDING_HOD / APPROVED / REJECTED
    private String facultyRecommendation;    // null / APPROVE / REJECT
    private String facultyRemarks;
    private String hodRemarks;
    private String requestDate;
    private String documentPath;
}
