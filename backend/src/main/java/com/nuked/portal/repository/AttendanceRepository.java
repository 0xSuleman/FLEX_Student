package com.nuked.portal.repository;

import com.nuked.portal.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByEnrollmentId(Long enrollmentId);
    Optional<Attendance> findBySessionIdAndEnrollmentId(Long sessionId, Long enrollmentId);
    List<Attendance> findBySessionId(Long sessionId);
}
