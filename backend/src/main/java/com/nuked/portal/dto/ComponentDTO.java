package com.nuked.portal.dto;

import lombok.Data;

@Data
public class ComponentDTO {
    private Long id;
    private String name;            // e.g. "Q1"
    private double maxMarks;
    private double weightage;
    private int displayOrder;
}
