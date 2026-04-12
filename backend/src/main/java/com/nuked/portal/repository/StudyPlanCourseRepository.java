package com.nuked.portal.repository;

import com.nuked.portal.model.StudyPlanCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyPlanCourseRepository extends JpaRepository<StudyPlanCourse, Long> {
    List<StudyPlanCourse> findByStudentId(Long studentId);
}
