package com.nuked.portal.controller;

import com.nuked.portal.dto.GradeListDTO;
import com.nuked.portal.service.GradeSubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/faculty/sections/{sectionId}/grades")
@RequiredArgsConstructor
public class FacultyGradeController {

    private final GradeSubmissionService gradeSubmissionService;

    @GetMapping
    public ResponseEntity<GradeListDTO> preview(Authentication auth,
                                                @PathVariable Long sectionId) {
        return ResponseEntity.ok(gradeSubmissionService.previewForFaculty(auth.getName(), sectionId));
    }

    @PostMapping("/submit")
    public ResponseEntity<GradeListDTO> submit(Authentication auth,
                                               @PathVariable Long sectionId) {
        return ResponseEntity.ok(gradeSubmissionService.submit(auth.getName(), sectionId));
    }
}
