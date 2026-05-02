package com.nuked.portal.repository;

import com.nuked.portal.model.CourseFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseFeedbackRepository extends JpaRepository<CourseFeedback, Long> {
    List<CourseFeedback> findByEnrollmentStudentId(Long studentId);
    List<CourseFeedback> findByEnrollmentCourseIdAndEnrollmentSectionAndEnrollmentSemester(
            Long courseId, String section, String semester);
}
