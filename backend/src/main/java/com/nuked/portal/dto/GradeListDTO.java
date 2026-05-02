package com.nuked.portal.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class GradeListDTO {
    private Long sectionId;
    private String courseCode;
    private String courseName;
    private String section;
    private String semester;
    private String facultyName;
    private String scheme;             // ABSOLUTE / RELATIVE
    private double totalWeight;
    private String state;              // null / DRAFT / SUBMITTED / APPROVED / REJECTED
    private String hodRemarks;
    private Map<String, Integer> distribution;   // letter → count
    private Double meanPercentage;
    private List<GradeRowDTO> rows;
    private boolean readyToSubmit;     // total weight = 100 AND every student has all scores
    private List<String> blockers;
}
