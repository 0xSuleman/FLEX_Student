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

import java.text.Normalizer;
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
                .orElseThrow(() -> new AccessDeniedException(
                        "Your account isn't registered. Sign out and sign back in — if it still fails, contact your faculty."));

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
            // Defense in depth: even if multiple OPEN sessions slip through
            // (auto-close race, prior-branch leftovers), only surface the
            // single most-recent unexpired one to the student.
            AttendanceSession latest = null;
            for (AttendanceSession s : open) {
                if (s.getEndsAt() != null && s.getEndsAt().isBefore(now)) continue;
                if (latest == null || s.getStartedAt().isAfter(latest.getStartedAt())) {
                    latest = s;
                }
            }
            if (latest == null) continue;
            boolean alreadyMarked = attendanceRepository
                    .findBySessionIdAndEnrollmentId(latest.getId(), e.getId()).isPresent();
            out.add(new OpenSessionForStudentDTO(
                    latest.getId(),
                    e.getId(),
                    e.getCourse().getCode(),
                    e.getCourse().getName(),
                    e.getSection(),
                    latest.getTopic(),
                    latest.getLectureDate(),
                    latest.getStartedAt(),
                    latest.getEndsAt(),
                    latest.getSessionToken(),
                    alreadyMarked,
                    latest.getBleDeviceName()));
        }
        return out;
    }

    @Transactional
    public OpenSessionForStudentDTO markPresent(String rollNo, Long sessionId,
                                                String reportedPinCode,
                                                Double studentLat, Double studentLon,
                                                String deviceUuid, String clientIp,
                                                String clientFingerprint) {
        Student student = studentRepository.findByRollNo(rollNo)
                .orElseThrow(() -> new AccessDeniedException(
                        "Your account isn't registered. Sign out and sign back in — if it still fails, ask your faculty to check your enrollment."));
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException(
                        "This attendance session no longer exists. Refresh and try again."));

        if (session.getStatus() != AttendanceSession.Status.OPEN) {
            throw new RuntimeException(
                    "The teacher has already closed this attendance session. Ask them to open a new one.");
        }
        if (session.getEndsAt() != null && session.getEndsAt().isBefore(Instant.now())) {
            throw new RuntimeException(
                    "The attendance window for this session has expired. Ask your teacher to open a new session.");
        }

        // PIN check: the 6-digit code the teacher announced when opening the
        // session must match exactly. The PIN is short-lived (window expires
        // when the session closes) and combined with geolocation below.
        String expected = session.getPinCode();
        String reported = reportedPinCode == null ? null : reportedPinCode.trim();
        if (expected == null || expected.trim().isEmpty()) {
            throw new RuntimeException("Session has no PIN — re-open the session.");
        }
        if (reported == null || reported.isEmpty()) {
            throw new RuntimeException("Enter the 6-digit PIN your teacher announced.");
        }
        if (!expected.equals(reported)) {
            throw new RuntimeException("Wrong PIN — check the code on your teacher's screen and re-enter.");
        }

        // Geolocation gate: student must be within radius of where the teacher
        // opened the session. Skipped only if the session has no recorded
        // location (older sessions / faculty denied permission at open-time).
        if (session.getLatitude() != null && session.getLongitude() != null) {
            if (studentLat == null || studentLon == null) {
                throw new RuntimeException("Location is required — allow location access in your browser, then retry.");
            }
            int radius = session.getAllowedRadiusMeters() == null ? 25 : session.getAllowedRadiusMeters();
            double distance = haversineMeters(
                    session.getLatitude(), session.getLongitude(),
                    studentLat, studentLon);
            if (distance > radius) {
                throw new RuntimeException(String.format(
                        "You're %.0f m from the classroom (max %d m). Move closer to mark attendance.",
                        distance, radius));
            }
        }

        // Find the student's enrollment matching this session's course/section/semester
        var fs = session.getFacultySection();
        Enrollment match = enrollmentRepository
                .findByStudentIdAndSemester(student.getId(), fs.getSemester())
                .stream()
                .filter(e -> e.getCourse().getId().equals(fs.getCourse().getId()) && fs.getSection().equals(e.getSection()))
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException(
                        "You aren't enrolled in this section. The teacher may have opened the session for a different class."));

        // Per-session device binding: if the same browser UUID has already
        // marked attendance for a *different* enrollment in this session,
        // reject the new mark — catches "log out, log in as friend" cheats.
        // Skipped if the client didn't send a UUID (unknown browser fallback).
        if (deviceUuid != null && !deviceUuid.isBlank()) {
            var collision = attendanceRepository
                    .findFirstBySessionIdAndDeviceUuidAndEnrollmentIdNot(sessionId, deviceUuid, match.getId());
            if (collision.isPresent()) {
                String otherRoll = collision.get().getEnrollment() != null
                        && collision.get().getEnrollment().getStudent() != null
                        ? collision.get().getEnrollment().getStudent().getRollNo()
                        : "another student";
                throw new RuntimeException(
                        "This device already marked attendance for " + otherRoll
                        + " in this session. Each student must mark from their own device.");
            }
        }

        // Idempotent — if already marked we just return the existing entry's view
        var existing = attendanceRepository.findBySessionIdAndEnrollmentId(sessionId, match.getId());
        if (existing.isEmpty()) {
            Attendance a = new Attendance();
            a.setEnrollment(match);
            a.setLectureNo(session.getLectureNo());
            a.setDate(session.getLectureDate());
            a.setDurationHrs(1.5);
            a.setPresence("P");
            a.setMethod("PIN");
            a.setSessionId(sessionId);
            a.setDeviceUuid(deviceUuid);
            a.setClientIp(clientIp);
            a.setClientFingerprint(clientFingerprint);
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

    /**
     * Aggressively normalize a BLE device name so visually-identical names
     * compare equal. Handles every common source of false mismatches:
     *   - case differences ("MacBook Air" vs "macbook air")
     *   - curly vs straight apostrophes/quotes (Apple injects U+2019)
     *   - non-breaking spaces, narrow no-break spaces, em/en spaces
     *   - zero-width chars (joiners, BOM, soft-hyphen)
     *   - leading/trailing whitespace + collapsed runs of inner whitespace
     *   - NFKC unicode form so wide/compatibility variants fold
     *   - all remaining punctuation stripped — only letters/digits/spaces remain
     * Net effect: only the *visible word content* matters.
     */
    private static String normalizeName(String s) {
        if (s == null) return "";
        // Unicode compatibility decomposition fold ("ｍａｃ" → "mac" etc).
        String n = Normalizer.normalize(s, Normalizer.Form.NFKC);
        // Strip zero-width / format characters.
        n = n.replaceAll("[\\u200B-\\u200F\\uFEFF\\u00AD]", "");
        // Replace any unicode whitespace (NBSP etc) with a regular space.
        n = n.replaceAll("\\p{Z}|\\s", " ");
        // Drop punctuation entirely so apostrophes/dashes/dots can't differ.
        n = n.replaceAll("[\\p{P}\\p{S}]", "");
        // Collapse runs of spaces and lowercase + trim.
        return n.replaceAll(" +", " ").trim().toLowerCase();
    }

    /** Haversine great-circle distance between two lat/long points, in meters. */
    private static double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
        double R = 6_371_000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
