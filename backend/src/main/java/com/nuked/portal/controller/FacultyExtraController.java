package com.nuked.portal.controller;

import com.nuked.portal.excel.AttendanceExcelExporter;
import com.nuked.portal.model.*;
import com.nuked.portal.repository.*;
import com.nuked.portal.service.FacultyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Faculty-side reads beyond marks/grades/attendance: timetable + feedback
 * summary. Both compose existing repos — no new entities.
 */
@RestController
@RequestMapping("/api/faculty")
@RequiredArgsConstructor
public class FacultyExtraController {

    private final FacultyService facultyService;
    private final FacultySectionRepository facultySectionRepository;
    private final CourseFeedbackRepository courseFeedbackRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRepository attendanceRepository;

    /**
     * Faculty's class schedule. Each row is one section with day/time/room.
     * Sourced from FacultySection rows assigned to this faculty.
     */
    @GetMapping("/timetable")
    public ResponseEntity<List<Map<String, Object>>> timetable(Authentication auth,
                                                               @RequestParam(required = false) String semester) {
        Faculty fac = facultyService.currentFaculty(auth.getName());
        List<FacultySection> rows = (semester == null || semester.isBlank())
                ? facultySectionRepository.findByFacultyId(fac.getId())
                : facultySectionRepository.findByFacultyIdAndSemester(fac.getId(), semester);
        List<Map<String, Object>> out = rows.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("sectionId", s.getId());
            m.put("courseCode", s.getCourse().getCode());
            m.put("courseName", s.getCourse().getName());
            m.put("creditHours", s.getCourse().getCreditHours());
            m.put("section", s.getSection());
            m.put("semester", s.getSemester());
            m.put("dayPattern", s.getDayPattern());
            m.put("timeSlot", s.getTimeSlot());
            m.put("room", s.getRoom());
            return m;
        }).toList();
        return ResponseEntity.ok(out);
    }

    /**
     * Per-section aggregated feedback (req 4.8.7). Returns rating histogram
     * and comment list for each of the faculty's sections.
     * Note: req 3.11.3 says individual responses are hidden during the active
     * window; for the demo we treat the feedback window as already closed.
     */
    @GetMapping("/feedback")
    public ResponseEntity<List<Map<String, Object>>> feedback(Authentication auth,
                                                              @RequestParam(required = false) String semester) {
        Faculty fac = facultyService.currentFaculty(auth.getName());
        List<FacultySection> rows = (semester == null || semester.isBlank())
                ? facultySectionRepository.findByFacultyId(fac.getId())
                : facultySectionRepository.findByFacultyIdAndSemester(fac.getId(), semester);

        List<Map<String, Object>> out = new ArrayList<>();
        for (FacultySection fs : rows) {
            List<CourseFeedback> fb = courseFeedbackRepository
                    .findByEnrollmentCourseIdAndEnrollmentSectionAndEnrollmentSemester(
                            fs.getCourse().getId(), fs.getSection(), fs.getSemester())
                    .stream().filter(f -> f.getStatus() == CourseFeedback.FeedbackStatus.SUBMITTED).toList();
            int total = fb.size();
            Map<Integer, Integer> hist = new LinkedHashMap<>();
            for (int i = 1; i <= 5; i++) hist.put(i, 0);
            for (CourseFeedback f : fb) {
                if (f.getRating() != null) hist.merge(f.getRating(), 1, Integer::sum);
            }
            double avg = fb.stream().filter(f -> f.getRating() != null)
                    .mapToInt(CourseFeedback::getRating).average().orElse(0);
            List<String> comments = fb.stream()
                    .map(CourseFeedback::getComments)
                    .filter(c -> c != null && !c.isBlank())
                    .collect(Collectors.toList());

            int enrolled = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                    fs.getCourse().getId(), fs.getSection(), fs.getSemester()).size();

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("sectionId", fs.getId());
            m.put("courseCode", fs.getCourse().getCode());
            m.put("courseName", fs.getCourse().getName());
            m.put("section", fs.getSection());
            m.put("semester", fs.getSemester());
            m.put("totalEnrolled", enrolled);
            m.put("totalResponses", total);
            m.put("responseRate", enrolled == 0 ? 0 : Math.round(100.0 * total / enrolled));
            m.put("averageRating", Math.round(avg * 10) / 10.0);
            m.put("ratingHistogram", hist);
            m.put("comments", comments);
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    /** Per-section attendance roster as a Flex-formatted xlsx. */
    @GetMapping("/sections/{sectionId}/attendance/export")
    public ResponseEntity<byte[]> exportAttendance(Authentication auth,
                                                   @PathVariable Long sectionId) throws IOException {
        FacultySection fs = facultyService.ownedSection(auth.getName(), sectionId);
        List<Enrollment> enrolled = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                fs.getCourse().getId(), fs.getSection(), fs.getSemester());
        List<AttendanceExcelExporter.RosterRow> roster = enrolled.stream()
                .filter(e -> e.getStudent() != null)
                .map(e -> new AttendanceExcelExporter.RosterRow(
                        e.getId(), e.getStudent().getRollNo(), e.getStudent().getName()))
                .toList();
        // Use closed sessions only — open ones don't have meaningful counts yet.
        List<AttendanceSession> sessions = attendanceSessionRepository
                .findByFacultySectionIdOrderByStartedAtDesc(fs.getId()).stream()
                .filter(s -> s.getStatus() == AttendanceSession.Status.CLOSED)
                .sorted(Comparator.comparing(AttendanceSession::getStartedAt))
                .toList();
        byte[] bytes = new AttendanceExcelExporter(fs, roster, sessions, attendanceRepository).build();
        String filename = "attendance-section-" + sectionId + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    /**
     * Per-section attendance sessions with present/absent/leave counts. Used
     * by Faculty Reports → Day-Wise Attendance + Attendance Sheet tabs.
     */
    @GetMapping("/sections/{sectionId}/attendance/sessions")
    public ResponseEntity<List<Map<String, Object>>> sessions(Authentication auth,
                                                              @PathVariable Long sectionId) {
        FacultySection fs = facultyService.ownedSection(auth.getName(), sectionId);
        List<AttendanceSession> sessions = attendanceSessionRepository
                .findByFacultySectionIdOrderByStartedAtDesc(fs.getId());

        List<Map<String, Object>> out = new ArrayList<>();
        // Reverse-iterate so newest is first but lecture-number is chronological.
        int lectureNo = sessions.size();
        for (AttendanceSession s : sessions) {
            List<Attendance> rec = attendanceRepository.findBySessionId(s.getId());
            int present = 0, absent = 0, leave = 0;
            for (Attendance a : rec) {
                String p = a.getPresence();
                if ("P".equals(p)) present++;
                else if ("A".equals(p)) absent++;
                else if ("L".equals(p)) leave++;
            }
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("sessionId", s.getId());
            m.put("lectureNo", lectureNo--);
            m.put("date", s.getStartedAt() == null ? null
                    : s.getStartedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDate().toString());
            m.put("topic", s.getTopic());
            m.put("status", s.getStatus().name());
            m.put("present", present);
            m.put("absent", absent);
            m.put("leave", leave);
            m.put("total", rec.size());
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }
}
