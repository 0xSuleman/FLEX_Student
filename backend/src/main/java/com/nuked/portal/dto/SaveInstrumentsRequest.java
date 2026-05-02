package com.nuked.portal.dto;

import lombok.Data;
import java.util.List;

/**
 * Faculty-side definition of every evaluation instrument for a section.
 * Sent on every save: the server replaces the section's instrument set with
 * what's in the payload (idempotent overwrite, simpler than diff-tracking).
 *
 * IDs are optional — present for known instruments/components, absent for newly
 * added ones. Removed entries (present in DB but missing here) are deleted,
 * which cascades to their Marks rows via FK ON DELETE CASCADE — but we'll
 * delete explicitly in the service to be safe.
 */
@Data
public class SaveInstrumentsRequest {
    private List<InstrumentDTO> instruments;
}
