package com.nuked.portal.repository;

import com.nuked.portal.model.GradeChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GradeChangeRequestRepository extends JpaRepository<GradeChangeRequest, Long> {
    List<GradeChangeRequest> findByEnrollmentStudentId(Long studentId);
}
