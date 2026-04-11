package com.flex.student.repository;

import com.flex.student.model.FeeDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeeDetailRepository extends JpaRepository<FeeDetail, Long> {
    List<FeeDetail> findByFeeChallanId(Long feeChallanId);
}
