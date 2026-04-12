package com.nuked.portal.controller;

import com.nuked.portal.model.Enrollment;
import com.nuked.portal.model.Student;
import com.nuked.portal.repository.EnrollmentRepository;
import com.nuked.portal.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/grade-report")
@RequiredArgsConstructor
public class GradeReportController {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getGradeReport(Authentication auth) {
        Student student = studentService.findByRollNo(auth.getName());
        List<Enrollment> allEnrollments = enrollmentRepository.findByStudentId(student.getId());

        // Group by semester
        Map<String, List<Enrollment>> bySemester = allEnrollments.stream()
                .collect(Collectors.groupingBy(Enrollment::getSemester, LinkedHashMap::new, Collectors.toList()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<Enrollment>> entry : bySemester.entrySet()) {
            Map<String, Object> semesterObj = new LinkedHashMap<>();
            semesterObj.put("semester", entry.getKey());

            List<Map<String, Object>> courses = entry.getValue().stream().map(e -> {
                Map<String, Object> courseMap = new LinkedHashMap<>();
                courseMap.put("courseCode", e.getCourse().getCode());
                courseMap.put("courseName", e.getCourse().getName());
                courseMap.put("theoryGrade", e.getGrade());
                courseMap.put("labGrade", null);
                return courseMap;
            }).collect(Collectors.toList());

            semesterObj.put("courses", courses);
            result.add(semesterObj);
        }

        return ResponseEntity.ok(result);
    }
}
