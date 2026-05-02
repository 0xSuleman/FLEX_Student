package com.nuked.portal.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * Combined faculty-view payload for a section: instrument definitions, the
 * roster, and a sparse marks map keyed by componentId then enrollmentId.
 * One round-trip to render the marks page.
 */
@Data
public class SectionMarksDTO {
    private List<InstrumentDTO> instruments;
    private List<RosterEntryDTO> roster;
    private Map<Long, Map<Long, Double>> scores;   // componentId → (enrollmentId → obtained)
    private String gradeSubmissionState;            // null | DRAFT | SUBMITTED | APPROVED | REJECTED
    private String gradeSubmissionRemarks;
}
