package com.flex.student.controller;

import com.flex.student.model.Student;
import com.flex.student.service.StudentService;
import com.flex.student.service.StudyPlanService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/study-plan")
public class StudyPlanController {

    private final StudyPlanService studyPlanService;
    private final StudentService studentService;

    public StudyPlanController(StudyPlanService studyPlanService, StudentService studentService) {
        this.studyPlanService = studyPlanService;
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<Map<String, List<Map<String, Object>>>> getStudyPlan(Authentication authentication) {
        Student student = studentService.findByRollNo(authentication.getName());
        Map<String, List<Map<String, Object>>> studyPlan = studyPlanService.getStudyPlan(student.getId());
        return ResponseEntity.ok(studyPlan);
    }
}
