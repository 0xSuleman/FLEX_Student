package com.flex.student.repository;

import com.flex.student.model.Marks;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarksRepository extends JpaRepository<Marks, Long> {
    List<Marks> findByEnrollmentId(Long enrollmentId);
}
