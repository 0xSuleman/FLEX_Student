package com.flex.student.repository;

import com.flex.student.model.FeeChallan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeeChallanRepository extends JpaRepository<FeeChallan, Long> {
    List<FeeChallan> findByStudentId(Long studentId);
}
