package com.nuked.portal.repository;

import com.nuked.portal.model.FeeChallan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeeChallanRepository extends JpaRepository<FeeChallan, Long> {
    List<FeeChallan> findByStudentId(Long studentId);
}
