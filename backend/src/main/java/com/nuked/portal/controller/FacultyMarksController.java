package com.nuked.portal.controller;

import com.nuked.portal.dto.SaveInstrumentsRequest;
import com.nuked.portal.dto.SaveScoresRequest;
import com.nuked.portal.dto.SectionMarksDTO;
import com.nuked.portal.dto.UploadResultDTO;
import com.nuked.portal.service.FacultyMarksService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/faculty/sections/{sectionId}/marks")
@RequiredArgsConstructor
public class FacultyMarksController {

    private final FacultyMarksService facultyMarksService;

    @GetMapping
    public ResponseEntity<SectionMarksDTO> load(Authentication auth,
                                                @PathVariable Long sectionId) {
        return ResponseEntity.ok(facultyMarksService.loadSection(auth.getName(), sectionId));
    }

    @PutMapping("/instruments")
    public ResponseEntity<SectionMarksDTO> saveInstruments(Authentication auth,
                                                           @PathVariable Long sectionId,
                                                           @RequestBody SaveInstrumentsRequest req) {
        return ResponseEntity.ok(facultyMarksService.saveInstruments(auth.getName(), sectionId, req));
    }

    @PutMapping("/scores")
    public ResponseEntity<Void> saveScores(Authentication auth,
                                           @PathVariable Long sectionId,
                                           @RequestBody SaveScoresRequest req) {
        facultyMarksService.saveScores(auth.getName(), sectionId, req);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate(Authentication auth,
                                                   @PathVariable Long sectionId) throws IOException {
        byte[] bytes = facultyMarksService.exportTemplate(auth.getName(), sectionId);
        String filename = "marks-template-section-" + sectionId + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResultDTO> upload(Authentication auth,
                                                  @PathVariable Long sectionId,
                                                  @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(facultyMarksService.uploadFilledTemplate(auth.getName(), sectionId, file));
    }
}
