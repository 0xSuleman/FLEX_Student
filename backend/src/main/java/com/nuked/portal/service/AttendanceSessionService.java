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

@Service
@RequiredArgsConstructor
public class AttendanceSessionService {

    private final FacultyService facultyService;
    private final AttendanceSessionRepository sessionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;

    @Transactional
    public AttendanceSessionDTO open(String username, OpenSessionRequest req) {
        FacultySection fs = facultyService.ownedSection(username, req.getFacultySectionId());

        int duration = req.getDurationMinutes() == null ? 15 : Math.max(5, Math.min(180, req.getDurationMinutes()));
        Instant now = Instant.now();

        // BLE device name MUST be provided — it's what students will pair to
        // when they Connect Bluetooth. Whatever the teacher's device is
        // currently broadcasting under (laptop name, phone name, beacon name).
        String bleName = req.getBleDeviceName() == null ? null : req.getBleDeviceName().trim();
        if (bleName == null || bleName.isEmpty()) {
            throw new IllegalArgumentException("bleDeviceName is required — type the exact name your laptop/phone is broadcasting via Bluetooth.");
        }

        AttendanceSession s = new AttendanceSession();
        s.setFacultySection(fs);
        s.setLectureDate(LocalDate.now());
        s.setLectureNo(nextLectureNo(fs));
        s.setTopic(req.getTopic());
        s.setSessionToken("BLE-" + fs.getCourse().getCode() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        s.setStartedAt(now);
        s.setEndsAt(now.plusSeconds(duration * 60L));
        s.setStatus(AttendanceSession.Status.OPEN);
        s.setDurationMinutes(duration);
        s.setBleDeviceName(bleName);
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
            out.add(new SessionMarkDTO(
                    e.getId(),
                    e.getStudent().getRollNo(),
                    e.getStudent().getName(),
                    presence,
                    method,
                    null));
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
                s.getBleDeviceName());
    }
}
