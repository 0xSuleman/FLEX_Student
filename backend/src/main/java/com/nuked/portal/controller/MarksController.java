package com.nuked.portal.controller;

import com.nuked.portal.dto.MarksDTO;
import com.nuked.portal.model.Student;
import com.nuked.portal.service.MarksService;
import com.nuked.portal.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/marks")
@RequiredArgsConstructor
public class MarksController {

    private final MarksService marksService;
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<List<MarksDTO>> getMarks(
            Authentication auth,
            @RequestParam(defaultValue = "Spring 2026") String semester) {
        Student student = studentService.findByRollNo(auth.getName());
        List<MarksDTO> marks = marksService.getMarksBySemester(student.getId(), semester);
        return ResponseEntity.ok(marks);
    }

    @GetMapping("/plo")
    public ResponseEntity<Map<String, Object>> getPloMarks(Authentication auth) {
        List<Map<String, Object>> ploScores = new ArrayList<>();

        ploScores.add(Map.of("plo", "PLO 1", "name", "Engineering Knowledge", "score", 85, "course", "CS3001 — Software Engineering", "assessment", "Midterm, Final"));
        ploScores.add(Map.of("plo", "PLO 2", "name", "Problem Analysis", "score", 78, "course", "CS3002 — Database Systems", "assessment", "Assignments, Project"));
        ploScores.add(Map.of("plo", "PLO 3", "name", "Design & Development", "score", 82, "course", "CS3001 — Software Engineering", "assessment", "Project, Lab"));
        ploScores.add(Map.of("plo", "PLO 4", "name", "Investigation", "score", 70, "course", "CS3003 — Operating Systems", "assessment", "Lab, Assignment"));
        ploScores.add(Map.of("plo", "PLO 5", "name", "Modern Tool Usage", "score", 88, "course", "CS3002 — Database Systems", "assessment", "Lab, Project"));
        ploScores.add(Map.of("plo", "PLO 6", "name", "Engineer & Society", "score", 75, "course", "HS3006 — Technical Writing", "assessment", "Report, Presentation"));
        ploScores.add(Map.of("plo", "PLO 7", "name", "Environment & Sustainability", "score", 65, "course", "HS3006 — Technical Writing", "assessment", "Essay"));
        ploScores.add(Map.of("plo", "PLO 8", "name", "Ethics", "score", 90, "course", "HS3006 — Technical Writing", "assessment", "Case Study"));
        ploScores.add(Map.of("plo", "PLO 9", "name", "Individual & Team Work", "score", 72, "course", "CS3001 — Software Engineering", "assessment", "Group Project"));
        ploScores.add(Map.of("plo", "PLO 10", "name", "Communication", "score", 80, "course", "HS3006 — Technical Writing", "assessment", "Presentation"));
        ploScores.add(Map.of("plo", "PLO 11", "name", "Project Management", "score", 68, "course", "CS3001 — Software Engineering", "assessment", "Project Plan"));
        ploScores.add(Map.of("plo", "PLO 12", "name", "Lifelong Learning", "score", 77, "course", "CS3003 — Operating Systems", "assessment", "Research Paper"));

        Map<String, Object> response = new HashMap<>();
        response.put("ploScores", ploScores);
        return ResponseEntity.ok(response);
    }
}
