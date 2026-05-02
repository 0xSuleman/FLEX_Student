package com.nuked.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadResultDTO {
    private boolean ok;
    private int rowsParsed;
    private int rowsApplied;
    private List<RowError> errors = new ArrayList<>();
    private List<String> structureErrors = new ArrayList<>();   // populated when 4.5.4 reject

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RowError {
        private int rowNumber;     // 1-based, sheet row
        private String rollNo;
        private String message;
    }
}
