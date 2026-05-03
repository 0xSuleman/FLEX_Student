package com.nuked.portal.service;

import com.nuked.portal.dto.OpenSessionForStudentDTO;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentAttendanceService {

    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRepository attendanceRepository;

    public List<OpenSessionForStudentDTO> openSessionsForStudent(String rollNo) {
        Student student = studentRepository.findByRollNo(rollNo)
                .orElseThrow(() -> new AccessDeniedException("Unknown student: " + rollNo));

        // Look across the student's *current* (Spring 2026) enrollments.
        List<Enrollment> enrollments = enrollmentRepository.findByStudentIdAndSemester(student.getId(), "Spring 2026");

        List<OpenSessionForStudentDTO> out = new ArrayList<>();
        Instant now = Instant.now();
        for (Enrollment e : enrollments) {
            List<AttendanceSession> open = sessionRepository
                    .findByStatusAndFacultySectionCourseIdAndFacultySectionSectionAndFacultySectionSemester(
                            AttendanceSession.Status.OPEN,
                            e.getCourse().getId(),
                            e.getSection(),
                            e.getSemester());
            for (AttendanceSession s : open) {
                if (s.getEndsAt() != null && s.getEndsAt().isBefore(now)) continue; // past expiry
                boolean alreadyMarked = attendanceRepository
                        .findBySessionIdAndEnrollmentId(s.getId(), e.getId()).isPresent();
                out.add(new OpenSessionForStudentDTO(
                        s.getId(),
                        e.getId(),
                        e.getCourse().getCode(),
                        e.getCourse().getName(),
                        e.getSection(),
                        s.getTopic(),
                        s.getLectureDate(),
                        s.getStartedAt(),
                        s.getEndsAt(),
                        s.getSessionToken(),
                        alreadyMarked,
                        s.getBleDeviceName()));
            }
        }
        return out;
    }

    @Transactional
    public OpenSessionForStudentDTO markPresent(String rollNo, Long sessionId, String reportedBleDeviceName) {
        Student student = studentRepository.findByRollNo(rollNo)
                .orElseThrow(() -> new AccessDeniedException("Unknown student: " + rollNo));
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() != AttendanceSession.Status.OPEN) {
            throw new RuntimeException("Session is not open");
        }
        if (session.getEndsAt() != null && session.getEndsAt().isBefore(Instant.now())) {
            throw new RuntimeException("Session window has expired");
        }

        // Real proximity check: the BLE device the student paired with MUST
        // equal the name the teacher registered when opening the session.
        // Anything else = student isn't connected to the teacher's device.
        String expected = session.getBleDeviceName();
        String reported = reportedBleDeviceName == null ? null : reportedBleDeviceName.trim();
        if (expected == null || expected.isEmpty()) {
            throw new RuntimeException("Session has no registered BLE device name — re-open the session.");
        }
        if (reported == null || reported.isEmpty()) {
            throw new RuntimeException("Connect Bluetooth first — attendance cannot be marked without a paired device.");
        }
        if (!expected.equalsIgnoreCase(reported)) {
            throw new RuntimeException("BLE device mismatch — you connected to '" + reported
                    + "' but this session is bound to '" + expected
                    + "'. Pair with the teacher's device.");
        }

        // Find the student's enrollment matching this session's course/section/semester
        var fs = session.getFacultySection();
        Enrollment match = enrollmentRepository
                .findByStudentIdAndSemester(student.getId(), fs.getSemester())
                .stream()
                .filter(e -> e.getCourse().getId().equals(fs.getCourse().getId()) && fs.getSection().equals(e.getSection()))
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException("You are not enrolled in this section"));

        // Idempotent — if already marked we just return the existing entry's view
        var existing = attendanceRepository.findBySessionIdAndEnrollmentId(sessionId, match.getId());
        if (existing.isEmpty()) {
            Attendance a = new Attendance();
            a.setEnrollment(match);
            a.setLectureNo(session.getLectureNo());
            a.setDate(session.getLectureDate());
            a.setDurationHrs(1.5);
            a.setPresence("P");
            a.setMethod("Bluetooth");
            a.setSessionId(sessionId);
            attendanceRepository.save(a);
        }

        return new OpenSessionForStudentDTO(
                sessionId,
                match.getId(),
                fs.getCourse().getCode(),
                fs.getCourse().getName(),
                fs.getSection(),
                session.getTopic(),
                session.getLectureDate(),
                session.getStartedAt(),
                session.getEndsAt(),
                session.getSessionToken(),
                true,
                session.getBleDeviceName());
    }
}
