package com.nuked.portal.repository;

import com.nuked.portal.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentIdAndSemester(Long studentId, String semester);
    List<Enrollment> findByStudentId(Long studentId);
    List<Enrollment> findByCourseIdAndSectionAndSemester(Long courseId, String section, String semester);
}
