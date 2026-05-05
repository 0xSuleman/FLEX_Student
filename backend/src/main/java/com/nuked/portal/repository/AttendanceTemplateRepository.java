package com.nuked.portal.repository;

import com.nuked.portal.model.AttendanceTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AttendanceTemplateRepository extends JpaRepository<AttendanceTemplate, Long> {
    Optional<AttendanceTemplate> findByFacultySectionId(Long facultySectionId);
}
