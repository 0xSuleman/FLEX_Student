package com.flex.student.controller;

import com.flex.student.dto.TranscriptDTO;
import com.flex.student.model.Student;
import com.flex.student.service.StudentService;
import com.flex.student.service.TranscriptService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transcript")
public class TranscriptController {

    private final TranscriptService transcriptService;
    private final StudentService studentService;

    public TranscriptController(TranscriptService transcriptService, StudentService studentService) {
        this.transcriptService = transcriptService;
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<TranscriptDTO> getTranscript(Authentication authentication) {
        Student student = studentService.findByRollNo(authentication.getName());
        TranscriptDTO transcript = transcriptService.getTranscript(student.getId());
        return ResponseEntity.ok(transcript);
    }
}
