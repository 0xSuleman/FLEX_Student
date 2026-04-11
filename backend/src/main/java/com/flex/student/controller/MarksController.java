package com.flex.student.controller;

import com.flex.student.dto.MarksDTO;
import com.flex.student.model.Student;
import com.flex.student.service.MarksService;
import com.flex.student.service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marks")
public class MarksController {

    private final MarksService marksService;
    private final StudentService studentService;

    public MarksController(MarksService marksService, StudentService studentService) {
        this.marksService = marksService;
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<List<MarksDTO>> getMarks(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "Fall 2024") String semester) {
        Student student = studentService.findByRollNo(authentication.getName());
        List<MarksDTO> marks = marksService.getMarksBySemester(student.getId(), semester);
        return ResponseEntity.ok(marks);
    }
}
