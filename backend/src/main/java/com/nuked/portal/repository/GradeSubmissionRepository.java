package com.nuked.portal.repository;

import com.nuked.portal.model.GradeSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GradeSubmissionRepository extends JpaRepository<GradeSubmission, Long> {
    Optional<GradeSubmission> findByFacultySectionId(Long facultySectionId);
    List<GradeSubmission> findByStateOrderBySubmittedAtAsc(GradeSubmission.State state);
}
