package com.nuked.portal.dto;

import lombok.Data;

import java.util.List;

@Data
public class MarksDTO {
    private String courseCode;
    private String courseName;
    private String semester;
    private List<EvaluationDTO> evaluations;

    @Data
    public static class EvaluationDTO {
        private Long id;
        private String evaluationType;
        private String evaluationName;
        private Double weightage;
        private Double obtained;
        private Double total;
        private Double average;
        private Double stdDev;
        private Double min;
        private Double max;
    }
}
