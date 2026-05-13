package com.nuked.portal.service;

import com.nuked.portal.dto.CaptiveAttendanceResponse;
import com.nuked.portal.model.Attendance;
import com.nuked.portal.model.AttendanceSession;
import com.nuked.portal.model.Enrollment;
import com.nuked.portal.model.Student;
import com.nuked.portal.repository.AttendanceRepository;
import com.nuked.portal.repository.AttendanceSessionRepository;
import com.nuked.portal.repository.EnrollmentRepository;
import com.nuked.portal.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class StudentAttendanceService {
    private static final Pattern ROLL_PATTERN = Pattern.compile("^[0-9]{2}[A-Z]-[0-9]{4}$");
    private static final Pattern MAC_PATTERN = Pattern.compile("^[0-9a-f]{2}(:[0-9a-f]{2}){5}$");

    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRepository attendanceRepository;

    @Transactional
    public CaptiveAttendanceResponse markPresentCaptive(String rollNo, Long sessionId,
                                                        String deviceUuid, String clientIp,
                                                        String clientFingerprint, String clientMac) {
        String normalizedRoll = normalizeRoll(rollNo);
        if (!ROLL_PATTERN.matcher(normalizedRoll).matches()) {
            throw new IllegalArgumentException("Roll number must look like 24L-3072.");
        }

        String normalizedMac = normalizeMac(clientMac);
        if (normalizedMac == null) {
            throw new RuntimeException("Could not identify this device on the attendance hotspot. Reconnect to Mark-Attendence and retry.");
        }

        Student student = studentRepository.findByRollNo(normalizedRoll)
                .orElseThrow(() -> new AccessDeniedException(
                        "Roll number is not registered in the portal."));
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException(
                        "This attendance session no longer exists. Ask your teacher to reopen it."));

        if (session.getStatus() != AttendanceSession.Status.OPEN) {
            throw new RuntimeException("The teacher has already closed this attendance session.");
        }
        if (session.getEndsAt() != null && session.getEndsAt().isBefore(Instant.now())) {
            throw new RuntimeException("The attendance window has expired.");
        }

        var fs = session.getFacultySection();
        Enrollment match = enrollmentRepository
                .findByStudentIdAndSemester(student.getId(), fs.getSemester())
                .stream()
                .filter(e -> e.getCourse().getId().equals(fs.getCourse().getId()) && fs.getSection().equals(e.getSection()))
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException(
                        "This roll number is not enrolled in the active section."));

        var existing = attendanceRepository.findBySessionIdAndEnrollmentId(sessionId, match.getId());
        if (existing.isEmpty()) {
            if (deviceUuid != null && !deviceUuid.isBlank()) {
                var uuidCollision = attendanceRepository
                        .findFirstBySessionIdAndDeviceUuidAndEnrollmentIdNot(sessionId, deviceUuid, match.getId());
                if (uuidCollision.isPresent()) {
                    String otherRoll = rollFor(uuidCollision.get());
                    throw new RuntimeException(
                            "This browser already marked attendance for " + otherRoll
                            + ". Each student must use their own device.");
                }
            }

            var macCollision = attendanceRepository
                    .findFirstBySessionIdAndClientMacAndEnrollmentIdNot(sessionId, normalizedMac, match.getId());
            if (macCollision.isPresent()) {
                String otherRoll = rollFor(macCollision.get());
                throw new RuntimeException(
                        "This phone already marked attendance for " + otherRoll
                        + ". Each student must use their own phone.");
            }

            Attendance a = new Attendance();
            a.setEnrollment(match);
            a.setLectureNo(session.getLectureNo());
            a.setDate(session.getLectureDate());
            a.setDurationHrs(durationFor(fs.getCourse().getCreditHours()));
            a.setPresence("P");
            a.setMethod("Automated");
            a.setSessionId(sessionId);
            a.setDeviceUuid(blankToNull(deviceUuid));
            a.setClientIp(blankToNull(clientIp));
            a.setClientMac(normalizedMac);
            a.setClientFingerprint(blankToNull(clientFingerprint));
            attendanceRepository.save(a);
        }

        return new CaptiveAttendanceResponse(
                sessionId,
                match.getId(),
                fs.getCourse().getCode(),
                fs.getCourse().getName(),
                fs.getSection(),
                session.getTopic(),
                session.getLectureDate(),
                session.getStartedAt(),
                session.getEndsAt(),
                true);
    }

    private static String normalizeRoll(String rollNo) {
        return rollNo == null ? "" : rollNo.trim().toUpperCase(Locale.ROOT);
    }

    private static String normalizeMac(String mac) {
        if (mac == null) return null;
        String normalized = mac.trim().toLowerCase(Locale.ROOT).replace('-', ':');
        if (!MAC_PATTERN.matcher(normalized).matches()) return null;
        return normalized;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String rollFor(Attendance attendance) {
        return attendance.getEnrollment() != null
                && attendance.getEnrollment().getStudent() != null
                && attendance.getEnrollment().getStudent().getRollNo() != null
                ? attendance.getEnrollment().getStudent().getRollNo()
                : "another student";
    }

    /**
     * Per-FAST policy, lecture duration depends on course credit hours:
     *   3 CrH → 1.5-hour lecture (theory)
     *   1 or 2 CrH → 3-hour session (lab / supplementary)
     */
    static double durationFor(Integer creditHours) {
        return (creditHours != null && creditHours == 3) ? 1.5 : 3.0;
    }

}
