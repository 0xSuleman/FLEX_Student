package com.flex.student.repository;

import com.flex.student.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentIdAndSemester(Long studentId, String semester);
    List<Enrollment> findByStudentId(Long studentId);
}
