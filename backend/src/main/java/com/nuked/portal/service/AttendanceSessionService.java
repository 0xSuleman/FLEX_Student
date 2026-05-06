package com.nuked.portal.service;

import com.nuked.portal.dto.AttendanceSessionDTO;
import com.nuked.portal.dto.CloseSessionRequest;
import com.nuked.portal.dto.OpenSessionRequest;
import com.nuked.portal.dto.SessionMarkDTO;
import com.nuked.portal.model.*;
import com.nuked.portal.repository.AttendanceRepository;
import com.nuked.portal.repository.AttendanceSessionRepository;
import com.nuked.portal.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.security.SecureRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceSessionService {

    private final FacultyService facultyService;
    private final AttendanceSessionRepository sessionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;

    private static final SecureRandom PIN_RANDOM = new SecureRandom();

    @Transactional
    public AttendanceSessionDTO open(String username, OpenSessionRequest req) {
        FacultySection fs = facultyService.ownedSection(username, req.getFacultySectionId());

        int duration = req.getDurationMinutes() == null ? 15 : Math.max(5, Math.min(180, req.getDurationMinutes()));
        Instant now = Instant.now();

        // Auto-close any still-OPEN sessions for this section before opening
        // a new one. Stops duplicate live sessions from cluttering students'
        // portals when faculty re-opens during the same lecture. saveAll +
        // flush guarantees the closes are persisted before the new session
        // is saved, so a brief race won't leave two OPEN rows for one section.
        List<AttendanceSession> stale = sessionRepository
                .findByFacultySectionIdOrderByStartedAtDesc(fs.getId())
                .stream()
                .filter(s -> s.getStatus() == AttendanceSession.Status.OPEN)
                .toList();
        for (AttendanceSession old : stale) {
            old.setStatus(AttendanceSession.Status.CLOSED);
            old.setClosedAt(now);
        }
        if (!stale.isEmpty()) {
            sessionRepository.saveAll(stale);
            sessionRepository.flush();
        }

        // 6-digit numeric PIN. SecureRandom so it's not predictable.
        String pinCode = String.format("%06d", PIN_RANDOM.nextInt(1_000_000));

        AttendanceSession s = new AttendanceSession();
        s.setFacultySection(fs);
        s.setLectureDate(LocalDate.now());
        s.setLectureNo(nextLectureNo(fs));
        s.setTopic(req.getTopic());
        s.setSessionToken("PIN-" + fs.getCourse().getCode() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        s.setStartedAt(now);
        s.setEndsAt(now.plusSeconds(duration * 60L));
        s.setStatus(AttendanceSession.Status.OPEN);
        s.setDurationMinutes(duration);
        s.setPinCode(pinCode);
        s.setLatitude(req.getLatitude());
        s.setLongitude(req.getLongitude());
        s.setAllowedRadiusMeters(25);
        sessionRepository.save(s);

        return toDto(s);
    }

    public AttendanceSessionDTO get(String username, Long sessionId) {
        AttendanceSession s = loadOwned(username, sessionId);
        return toDto(s);
    }

    /**
     * Live snapshot of every student in the section + their current mark in this session
     * (or "Pending" if no Attendance row exists yet). Powers the faculty's BLE roster
     * polling so the simulator can be removed.
     */
    public List<SessionMarkDTO> liveMarks(String username, Long sessionId) {
        AttendanceSession s = loadOwned(username, sessionId);
        FacultySection fs = s.getFacultySection();
        List<Enrollment> roster = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                fs.getCourse().getId(), fs.getSection(), fs.getSemester());

        List<SessionMarkDTO> out = new ArrayList<>();
        for (Enrollment e : roster) {
            var marked = attendanceRepository.findBySessionIdAndEnrollmentId(sessionId, e.getId());
            String presence = marked.map(Attendance::getPresence).orElse(null);
            String method = marked.map(Attendance::getMethod).orElse(null);
            String deviceUuid = marked.map(Attendance::getDeviceUuid).orElse(null);
            String clientIp = marked.map(Attendance::getClientIp).orElse(null);
            String clientFingerprint = marked.map(Attendance::getClientFingerprint).orElse(null);
            out.add(new SessionMarkDTO(
                    e.getId(),
                    e.getStudent().getRollNo(),
                    e.getStudent().getName(),
                    presence,
                    method,
                    null,
                    deviceUuid,
                    clientIp,
                    clientFingerprint));
        }
        return out;
    }

    /**
     * Update marks on an already-CLOSED session per req 4.2.4 — faculty can
     * change a student's P/A/L on a past lecture without modifying the date.
     * Faculty does NOT need to re-enter topic/duration; we only touch the
     * `presence` + `method` of existing/new Attendance rows for the session.
     */
    @Transactional
    public AttendanceSessionDTO updateMarks(String username, Long sessionId, CloseSessionRequest req) {
        AttendanceSession s = loadOwned(username, sessionId);
        if (s.getStatus() != AttendanceSession.Status.CLOSED) {
            throw new IllegalStateException("Session " + sessionId + " is " + s.getStatus()
                    + ", not CLOSED. Use the live close flow instead.");
        }
        if (req == null || req.getMarks() == null) return toDto(s);

        FacultySection fs = s.getFacultySection();
        for (CloseSessionRequest.MarkEntry m : req.getMarks()) {
            if (m.getEnrollmentId() == null || m.getPresence() == null) continue;
            Enrollment e = enrollmentRepository.findById(m.getEnrollmentId()).orElse(null);
            if (e == null) continue;
            // Defense in depth: enrollment must belong to this section.
            if (!e.getCourse().getId().equals(fs.getCourse().getId())
                    || !java.util.Objects.equals(e.getSection(), fs.getSection())
                    || !java.util.Objects.equals(e.getSemester(), fs.getSemester())) continue;

            Attendance a = attendanceRepository
                    .findBySessionIdAndEnrollmentId(s.getId(), e.getId())
                    .orElseGet(Attendance::new);
            a.setEnrollment(e);
            a.setLectureNo(s.getLectureNo());
            a.setDate(s.getLectureDate());
            a.setDurationHrs(1.5);
            a.setPresence(m.getPresence());
            a.setMethod(m.getMethod() == null ? "Manual" : m.getMethod());
            a.setSessionId(s.getId());
            attendanceRepository.save(a);
        }
        return toDto(s);
    }

    @Transactional
    public AttendanceSessionDTO close(String username, Long sessionId, CloseSessionRequest req) {
        AttendanceSession s = loadOwned(username, sessionId);
        if (s.getStatus() == AttendanceSession.Status.CLOSED) return toDto(s);

        FacultySection fs = s.getFacultySection();
        List<Enrollment> roster = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                fs.getCourse().getId(), fs.getSection(), fs.getSemester());

        Map<Long, CloseSessionRequest.MarkEntry> byEnrollment = new HashMap<>();
        if (req != null && req.getMarks() != null) {
            for (CloseSessionRequest.MarkEntry m : req.getMarks()) {
                if (m.getEnrollmentId() != null) byEnrollment.put(m.getEnrollmentId(), m);
            }
        }

        for (Enrollment e : roster) {
            // Skip enrollments where the student already self-marked via the
            // student "Mark Attendance" button — those rows are authoritative
            // and shouldn't be overwritten by the faculty's bulk close.
            if (attendanceRepository.findBySessionIdAndEnrollmentId(s.getId(), e.getId()).isPresent()) continue;

            CloseSessionRequest.MarkEntry m = byEnrollment.get(e.getId());
            String presence;
            String method;
            if (m == null || m.getPresence() == null || m.getPresence().isBlank()) {
                presence = "A";
                method = "Auto";
            } else {
                presence = m.getPresence();
                method = m.getMethod() == null ? "Manual" : m.getMethod();
            }
            Attendance a = new Attendance();
            a.setEnrollment(e);
            a.setLectureNo(s.getLectureNo());
            a.setDate(s.getLectureDate());
            a.setDurationHrs(1.5);
            a.setPresence(presence);
            a.setMethod(method);
            a.setSessionId(s.getId());
            attendanceRepository.save(a);
        }

        s.setClosedAt(Instant.now());
        s.setStatus(AttendanceSession.Status.CLOSED);
        sessionRepository.save(s);
        return toDto(s);
    }

    /**
     * Hard-delete a session and every Attendance row tied to it. Faculty-only,
     * verifies ownership. Used by the "Delete Session" button in Edit mode
     * when faculty wants to undo a misopened lecture entirely.
     */
    @Transactional
    public void deleteSession(String username, Long sessionId) {
        AttendanceSession s = loadOwned(username, sessionId);
        for (Attendance a : attendanceRepository.findBySessionId(sessionId)) {
            attendanceRepository.delete(a);
        }
        sessionRepository.delete(s);
    }

    /**
     * Safety net for the auto-absent flow: if faculty closed their tab before
     * the timer hit zero, expired sessions would otherwise stay OPEN forever.
     * This runs every 60 seconds, finds OPEN sessions whose endsAt is past,
     * and closes them — auto-marking every unmarked student as Absent
     * (method=Auto), exactly the same way the manual Close & Save button
     * does. Faculty can still adjust via Edit mode afterwards.
     */
    @Scheduled(fixedDelay = 60_000L, initialDelay = 30_000L)
    @Transactional
    public void autoCloseExpiredSessions() {
        Instant cutoff = Instant.now();
        List<AttendanceSession> expired = sessionRepository.findAll().stream()
                .filter(s -> s.getStatus() == AttendanceSession.Status.OPEN)
                .filter(s -> s.getEndsAt() != null && s.getEndsAt().isBefore(cutoff))
                .toList();
        if (expired.isEmpty()) return;
        for (AttendanceSession s : expired) {
            try {
                closeWithAutoAbsent(s, cutoff);
                log.info("[auto-close] session {} → CLOSED (expired at {})", s.getId(), s.getEndsAt());
            } catch (Exception e) {
                log.warn("[auto-close] failed for session {}: {}", s.getId(), e.getMessage());
            }
        }
    }

    /**
     * Reusable close-and-mark-absent path. Used by both the user-facing
     * close() (with auth) and the scheduled auto-close (no user context).
     */
    private void closeWithAutoAbsent(AttendanceSession s, Instant when) {
        if (s.getStatus() == AttendanceSession.Status.CLOSED) return;
        var fs = s.getFacultySection();
        List<Enrollment> roster = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                fs.getCourse().getId(), fs.getSection(), fs.getSemester());
        for (Enrollment e : roster) {
            if (attendanceRepository.findBySessionIdAndEnrollmentId(s.getId(), e.getId()).isPresent()) continue;
            Attendance a = new Attendance();
            a.setEnrollment(e);
            a.setLectureNo(s.getLectureNo());
            a.setDate(s.getLectureDate());
            a.setDurationHrs(1.5);
            a.setPresence("A");
            a.setMethod("Auto");
            a.setSessionId(s.getId());
            attendanceRepository.save(a);
        }
        s.setClosedAt(when);
        s.setStatus(AttendanceSession.Status.CLOSED);
        sessionRepository.save(s);
    }

    private AttendanceSession loadOwned(String username, Long sessionId) {
        AttendanceSession s = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        // Ownership check — the session's faculty section must belong to this faculty
        facultyService.ownedSection(username, s.getFacultySection().getId());
        return s;
    }

    private int nextLectureNo(FacultySection fs) {
        // Highest lectureNo among existing attendance rows for this section's enrollments + 1.
        List<Enrollment> roster = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                fs.getCourse().getId(), fs.getSection(), fs.getSemester());
        int max = 0;
        for (Enrollment e : roster) {
            for (Attendance a : attendanceRepository.findByEnrollmentId(e.getId())) {
                if (a.getLectureNo() != null && a.getLectureNo() > max) max = a.getLectureNo();
            }
        }
        return max + 1;
    }

    private AttendanceSessionDTO toDto(AttendanceSession s) {
        FacultySection fs = s.getFacultySection();
        return new AttendanceSessionDTO(
                s.getId(),
                fs.getId(),
                fs.getCourse().getCode(),
                fs.getSection(),
                fs.getSemester(),
                s.getLectureDate(),
                s.getLectureNo(),
                s.getTopic(),
                s.getSessionToken(),
                s.getStartedAt(),
                s.getEndsAt(),
                s.getClosedAt(),
                s.getStatus().name(),
                s.getDurationMinutes(),
                s.getBleDeviceName(),
                s.getPinCode());
    }
}
