package com.nuked.portal.controller;

import com.nuked.portal.dto.GradeListDTO;
import com.nuked.portal.dto.HodDecisionRequest;
import com.nuked.portal.model.GradeSubmission;
import com.nuked.portal.repository.GradeSubmissionRepository;
import com.nuked.portal.service.GradeSubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hod/grade-approvals")
@RequiredArgsConstructor
public class HodGradeController {

    private final GradeSubmissionService gradeSubmissionService;
    private final GradeSubmissionRepository gradeSubmissionRepository;

    /** All currently SUBMITTED grade lists awaiting HOD decision. */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> pending() {
        List<GradeListDTO> lists = gradeSubmissionService.pendingForHod();
        // Cross-reference each list with its submission ID so the UI can post
        // approve/reject without an extra round-trip.
        List<Map<String, Object>> out = lists.stream().map(l -> {
            GradeSubmission gs = gradeSubmissionRepository.findByFacultySectionId(l.getSectionId()).orElse(null);
            return Map.<String, Object>of(
                    "submissionId", gs == null ? null : gs.getId(),
                    "list", l);
        }).toList();
        return ResponseEntity.ok(out);
    }

    @GetMapping("/{submissionId}")
    public ResponseEntity<GradeListDTO> detail(@PathVariable Long submissionId) {
        return ResponseEntity.ok(gradeSubmissionService.previewForHod(submissionId));
    }

    @PostMapping("/{submissionId}/approve")
    public ResponseEntity<GradeListDTO> approve(@PathVariable Long submissionId,
                                                @RequestBody(required = false) HodDecisionRequest req) {
        return ResponseEntity.ok(gradeSubmissionService.approve(
                submissionId, req == null ? null : req.getRemarks()));
    }

    @PostMapping("/{submissionId}/reject")
    public ResponseEntity<GradeListDTO> reject(@PathVariable Long submissionId,
                                               @RequestBody HodDecisionRequest req) {
        return ResponseEntity.ok(gradeSubmissionService.reject(
                submissionId, req == null ? null : req.getRemarks()));
    }
}
