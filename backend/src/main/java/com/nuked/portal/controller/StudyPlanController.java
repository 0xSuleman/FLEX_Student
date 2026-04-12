package com.nuked.portal.controller;

import com.nuked.portal.model.Student;
import com.nuked.portal.model.StudyPlanCourse;
import com.nuked.portal.repository.StudyPlanCourseRepository;
import com.nuked.portal.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/study-plan")
@RequiredArgsConstructor
public class StudyPlanController {

    private final StudyPlanCourseRepository studyPlanCourseRepository;
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getStudyPlan(Authentication auth) {
        Student student = studentService.findByRollNo(auth.getName());
        List<StudyPlanCourse> planCourses = studyPlanCourseRepository.findByStudentId(student.getId());

        // Group by plannedSemester (which represents the semester number as a string)
        Map<String, List<StudyPlanCourse>> bySemester = planCourses.stream()
                .collect(Collectors.groupingBy(StudyPlanCourse::getPlannedSemester, TreeMap::new, Collectors.toList()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<StudyPlanCourse>> entry : bySemester.entrySet()) {
            Map<String, Object> semesterObj = new LinkedHashMap<>();

            // Parse semester number from the plannedSemester string
            try {
                semesterObj.put("semester", Integer.parseInt(entry.getKey()));
            } catch (NumberFormatException e) {
                semesterObj.put("semester", entry.getKey());
            }

            List<Map<String, Object>> courses = entry.getValue().stream().map(spc -> {
                Map<String, Object> courseMap = new LinkedHashMap<>();
                courseMap.put("courseCode", spc.getCourse().getCode());
                courseMap.put("courseName", spc.getCourse().getName());
                courseMap.put("creditHours", spc.getCourse().getCreditHours());
                courseMap.put("type", spc.getCourse().getType() != null ? spc.getCourse().getType().name() : "CORE");
                return courseMap;
            }).collect(Collectors.toList());

            semesterObj.put("courses", courses);
            result.add(semesterObj);
        }

        return ResponseEntity.ok(result);
    }
}
