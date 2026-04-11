package com.flex.student.service;

import com.flex.student.model.StudyPlanCourse;
import com.flex.student.repository.StudyPlanCourseRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudyPlanService {

    private final StudyPlanCourseRepository studyPlanCourseRepository;

    public StudyPlanService(StudyPlanCourseRepository studyPlanCourseRepository) {
        this.studyPlanCourseRepository = studyPlanCourseRepository;
    }

    public Map<String, List<Map<String, Object>>> getStudyPlan(Long studentId) {
        List<StudyPlanCourse> courses = studyPlanCourseRepository.findByStudentId(studentId);

        return courses.stream()
                .collect(Collectors.groupingBy(
                        StudyPlanCourse::getPlannedSemester,
                        LinkedHashMap::new,
                        Collectors.mapping(spc -> {
                            Map<String, Object> courseMap = new LinkedHashMap<>();
                            courseMap.put("id", spc.getId());
                            courseMap.put("courseCode", spc.getCourse().getCode());
                            courseMap.put("courseName", spc.getCourse().getName());
                            courseMap.put("creditHours", spc.getCourse().getCreditHours());
                            courseMap.put("courseType", spc.getCourse().getType() != null ? spc.getCourse().getType().name() : null);
                            return courseMap;
                        }, Collectors.toList())
                ));
    }
}
