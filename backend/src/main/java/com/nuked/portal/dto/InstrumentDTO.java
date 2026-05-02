package com.nuked.portal.dto;

import lombok.Data;
import java.util.List;

@Data
public class InstrumentDTO {
    private Long id;
    private String category;        // QUIZ / ASSIGNMENT / SESSIONAL_1 / SESSIONAL_2 / FINAL
    private String name;            // e.g. "Quiz 1"
    private int displayOrder;
    private String publishState;    // DRAFT / PUBLISHED
    private List<ComponentDTO> components;
}
