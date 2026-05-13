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

    /**
     * Per-session device-binding check: has *any other* enrollment in this
     * session already marked with the same device UUID? Returns the colliding
     * row if so — caller can use enrollment.rollNo for a clear error message.
     */
    Optional<Attendance> findFirstBySessionIdAndDeviceUuidAndEnrollmentIdNot(
            Long sessionId, String deviceUuid, Long enrollmentId);

    Optional<Attendance> findFirstBySessionIdAndClientMacAndEnrollmentIdNot(
            Long sessionId, String clientMac, Long enrollmentId);
}
