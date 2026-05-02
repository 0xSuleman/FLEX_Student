package com.nuked.portal.dto;

import lombok.Data;
import java.util.List;

@Data
public class SaveScoresRequest {
    private List<ScoreEntry> scores;

    @Data
    public static class ScoreEntry {
        private Long componentId;
        private Long enrollmentId;
        private Double obtained;   // null clears the score
    }
}
