package com.nuked.portal.repository;

import com.nuked.portal.model.FacultySection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacultySectionRepository extends JpaRepository<FacultySection, Long> {
    List<FacultySection> findByFacultyIdAndSemester(Long facultyId, String semester);
    List<FacultySection> findByFacultyId(Long facultyId);
    Optional<FacultySection> findByIdAndFacultyId(Long id, Long facultyId);
}
