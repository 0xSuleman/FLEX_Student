package com.flex.student.repository;

import com.flex.student.model.CourseWithdrawRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseWithdrawRequestRepository extends JpaRepository<CourseWithdrawRequest, Long> {
    List<CourseWithdrawRequest> findByEnrollmentStudentId(Long studentId);
}
