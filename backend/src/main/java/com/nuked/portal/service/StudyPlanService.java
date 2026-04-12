package com.nuked.portal.service;

import com.nuked.portal.model.StudyPlanCourse;
import com.nuked.portal.repository.StudyPlanCourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudyPlanService {

    private final StudyPlanCourseRepository studyPlanCourseRepository;

    public List<Map<String, Object>> getStudyPlan(Long studentId) {
        List<StudyPlanCourse> allCourses = studyPlanCourseRepository.findByStudentId(studentId);

        Map<String, List<StudyPlanCourse>> grouped = allCourses.stream()
                .collect(Collectors.groupingBy(StudyPlanCourse::getPlannedSemester, LinkedHashMap::new, Collectors.toList()));

        List<Map<String, Object>> result = new ArrayList<>();

        for (Map.Entry<String, List<StudyPlanCourse>> entry : grouped.entrySet()) {
            Map<String, Object> semesterMap = new LinkedHashMap<>();

            String semesterStr = entry.getKey();
            Integer semesterNum;
            try {
                semesterNum = Integer.parseInt(semesterStr.replace("Semester ", ""));
            } catch (NumberFormatException e) {
                semesterNum = 0;
            }
            semesterMap.put("semester", semesterNum);

            List<Map<String, Object>> courses = entry.getValue().stream().map(spc -> {
                Map<String, Object> courseMap = new LinkedHashMap<>();
                courseMap.put("courseCode", spc.getCourse().getCode());
                courseMap.put("courseName", spc.getCourse().getName());
                courseMap.put("creditHours", spc.getCourse().getCreditHours());
                courseMap.put("type", spc.getCourse().getType() != null ? spc.getCourse().getType().name() : null);
                return courseMap;
            }).collect(Collectors.toList());

            semesterMap.put("courses", courses);
            result.add(semesterMap);
        }

        return result;
    }
}
