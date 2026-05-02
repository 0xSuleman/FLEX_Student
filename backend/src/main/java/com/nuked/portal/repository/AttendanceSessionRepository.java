package com.nuked.portal.repository;

import com.nuked.portal.model.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    Optional<AttendanceSession> findBySessionToken(String token);
    List<AttendanceSession> findByFacultySectionIdOrderByStartedAtDesc(Long facultySectionId);

    List<AttendanceSession> findByStatusAndFacultySectionCourseIdAndFacultySectionSectionAndFacultySectionSemester(
            AttendanceSession.Status status,
            Long courseId,
            String section,
            String semester);
}
