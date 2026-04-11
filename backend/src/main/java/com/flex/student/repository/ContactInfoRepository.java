package com.flex.student.repository;

import com.flex.student.model.ContactInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContactInfoRepository extends JpaRepository<ContactInfo, Long> {
    Optional<ContactInfo> findByStudentId(Long studentId);
}
