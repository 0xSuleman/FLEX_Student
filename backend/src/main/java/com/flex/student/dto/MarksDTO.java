package com.flex.student.dto;

import lombok.Data;
import java.util.List;

@Data
public class MarksDTO {
    private String courseCode;
    private String courseName;
    private String semester;
    private List<MarkEntryDTO> marks;

    @Data
    public static class MarkEntryDTO {
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
