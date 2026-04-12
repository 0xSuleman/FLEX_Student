package com.nuked.portal.repository;

import com.nuked.portal.model.FamilyInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FamilyInfoRepository extends JpaRepository<FamilyInfo, Long> {
    List<FamilyInfo> findByStudentId(Long studentId);
}
