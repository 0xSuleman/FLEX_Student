package com.nuked.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FacultySectionDTO {
    private Long id;
    private String courseCode;
    private String courseName;
    private Integer creditHours;
    private String section;
    private String semester;
    private String room;
    private String dayPattern;
    private String timeSlot;
    private Integer enrolled;
}
