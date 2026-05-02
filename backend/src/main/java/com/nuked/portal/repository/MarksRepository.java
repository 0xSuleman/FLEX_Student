package com.nuked.portal.repository;

import com.nuked.portal.model.Marks;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarksRepository extends JpaRepository<Marks, Long> {
    List<Marks> findByEnrollmentId(Long enrollmentId);
    List<Marks> findByComponentId(Long componentId);
    java.util.Optional<Marks> findByEnrollmentIdAndComponentId(Long enrollmentId, Long componentId);
}
