package com.flex.student.repository;

import com.flex.student.model.GradeChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GradeChangeRequestRepository extends JpaRepository<GradeChangeRequest, Long> {
    List<GradeChangeRequest> findByEnrollmentStudentId(Long studentId);
}
