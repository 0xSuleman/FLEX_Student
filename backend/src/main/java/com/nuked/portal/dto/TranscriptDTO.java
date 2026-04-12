package com.nuked.portal.dto;

import lombok.Data;

import java.util.List;

@Data
public class TranscriptDTO {
    private String studentName;
    private String rollNo;
    private String degree;
    private String campus;
    private List<SemesterTranscriptDTO> semesters;

    @Data
    public static class SemesterTranscriptDTO {
        private String semester;
        private Integer crAttempted;
        private Integer crEarned;
        private Double sgpa;
        private Double cgpa;
        private List<CourseGradeDTO> courses;
    }

    @Data
    public static class CourseGradeDTO {
        private String courseCode;
        private String courseName;
        private Integer creditHours;
        private String grade;
        private Double points;
    }
}
