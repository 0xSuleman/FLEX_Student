package com.nuked.portal.repository;

import com.nuked.portal.model.RetakeExamRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RetakeExamRequestRepository extends JpaRepository<RetakeExamRequest, Long> {
    List<RetakeExamRequest> findByEnrollmentStudentId(Long studentId);
    List<RetakeExamRequest> findByStatusOrderByRequestDateAsc(RetakeExamRequest.RequestStatus status);
}
