package com.nuked.portal.dto;

import lombok.Data;

import java.util.List;

@Data
public class AttendanceDTO {
    private String courseCode;
    private String courseName;
    private String semester;
    private int totalLectures;
    private int present;
    private int absent;
    private int leaves;
    private double percentage;
    private List<AttendanceRecordDTO> records;

    @Data
    public static class AttendanceRecordDTO {
        private Integer lectureNo;
        private String date;
        private Double durationHrs;
        private String presence;
    }
}
