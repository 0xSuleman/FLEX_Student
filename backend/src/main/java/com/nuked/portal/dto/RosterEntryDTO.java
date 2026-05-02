package com.nuked.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RosterEntryDTO {
    private Long enrollmentId;
    private String rollNo;
    private String name;
    private String program;
}
