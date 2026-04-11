package com.flex.student.repository;

import com.flex.student.model.RetakeExamRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RetakeExamRequestRepository extends JpaRepository<RetakeExamRequest, Long> {
    List<RetakeExamRequest> findByEnrollmentStudentId(Long studentId);
}
