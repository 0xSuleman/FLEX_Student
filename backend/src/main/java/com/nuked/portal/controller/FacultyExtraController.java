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
    private final AttendanceTemplateRepository attendanceTemplateRepository;

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

    /** Faculty uploads Sir's attendance template (xlsx) for a section.
     *  Stored on the section; reused by every "download today's sheet" call. */
    @PostMapping(value = "/sections/{sectionId}/attendance/template",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadTemplate(Authentication auth,
                                                              @PathVariable Long sectionId,
                                                              @RequestParam("file") org.springframework.web.multipart.MultipartFile file) throws IOException {
        FacultySection fs = facultyService.ownedSection(auth.getName(), sectionId);
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Template file is required.");
        }
        String name = file.getOriginalFilename() == null ? "template.xlsx" : file.getOriginalFilename();
        if (!name.toLowerCase().endsWith(".xlsx")) {
            throw new IllegalArgumentException("Template must be a .xlsx file.");
        }
        AttendanceTemplate t = attendanceTemplateRepository.findByFacultySectionId(fs.getId())
                .orElseGet(AttendanceTemplate::new);
        t.setFacultySection(fs);
        t.setFilename(name);
        t.setFileBytes(file.getBytes());
        t.setUploadedAt(java.time.LocalDateTime.now());
        attendanceTemplateRepository.save(t);
        Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("filename", t.getFilename());
        resp.put("size", t.getFileBytes().length);
        resp.put("uploadedAt", t.getUploadedAt().toString());
        return ResponseEntity.ok(resp);
    }

    /** Tells the UI whether a template is uploaded for this section. */
    @GetMapping("/sections/{sectionId}/attendance/template")
    public ResponseEntity<Map<String, Object>> templateStatus(Authentication auth,
                                                              @PathVariable Long sectionId) {
        FacultySection fs = facultyService.ownedSection(auth.getName(), sectionId);
        return attendanceTemplateRepository.findByFacultySectionId(fs.getId())
                .<ResponseEntity<Map<String, Object>>>map(t -> {
                    Map<String, Object> resp = new java.util.LinkedHashMap<>();
                    resp.put("uploaded", true);
                    resp.put("filename", t.getFilename());
                    resp.put("size", t.getFileBytes().length);
                    resp.put("uploadedAt", t.getUploadedAt().toString());
                    return ResponseEntity.ok(resp);
                })
                .orElse(ResponseEntity.ok(Map.of("uploaded", false)));
    }

    /** Download the template with today's column appended (P/A per student). */
    @GetMapping("/sections/{sectionId}/attendance/sheet")
    public ResponseEntity<byte[]> downloadFilledSheet(Authentication auth,
                                                      @PathVariable Long sectionId,
                                                      @RequestParam(required = false) String date) throws IOException {
        FacultySection fs = facultyService.ownedSection(auth.getName(), sectionId);
        AttendanceTemplate t = attendanceTemplateRepository.findByFacultySectionId(fs.getId())
                .orElseThrow(() -> new IllegalStateException(
                        "No template uploaded for this section yet. Click 'Upload Template' first."));

        java.time.LocalDate lectureDate = (date == null || date.isBlank())
                ? java.time.LocalDate.now()
                : java.time.LocalDate.parse(date);

        // For every student in the section, decide P / A / L for today, and
        // also compute cumulative absent + late HOURS across the entire
        // semester (for the A and L summary columns Sir's sheet has at D, E).
        java.util.List<Enrollment> enrolled = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                fs.getCourse().getId(), fs.getSection(), fs.getSemester());

        // Lecture duration is course-dependent: 3 CrH → 1.5 hr, 1 or 2 CrH → 3 hr.
        double sessionDuration = (fs.getCourse().getCreditHours() != null
                && fs.getCourse().getCreditHours() == 3) ? 1.5 : 3.0;

        // Find today's actual P/A/L per enrollment by walking today's sessions.
        java.util.List<AttendanceSession> sessionsToday = attendanceSessionRepository
                .findByFacultySectionIdOrderByStartedAtDesc(fs.getId()).stream()
                .filter(s -> lectureDate.equals(s.getLectureDate()))
                .toList();
        java.util.Map<Long, String> todayPresenceByEnrollment = new java.util.HashMap<>();
        for (AttendanceSession s : sessionsToday) {
            for (Attendance a : attendanceRepository.findBySessionId(s.getId())) {
                if (a.getEnrollment() == null || a.getPresence() == null) continue;
                // If a student appears in multiple sessions today, prefer P > L > A.
                String prev = todayPresenceByEnrollment.get(a.getEnrollment().getId());
                String next = a.getPresence();
                if ("P".equals(next) || prev == null
                        || ("L".equals(next) && "A".equals(prev))) {
                    todayPresenceByEnrollment.put(a.getEnrollment().getId(), next);
                }
            }
        }

        java.util.Map<String, String> presenceByRoll = new java.util.HashMap<>();
        java.util.Map<String, Double> absentHoursByRoll = new java.util.HashMap<>();
        java.util.Map<String, Double> lateHoursByRoll = new java.util.HashMap<>();
        for (Enrollment e : enrolled) {
            if (e.getStudent() == null) continue;
            String roll = e.getStudent().getRollNo();
            // Today's mark — default to A if no row exists yet for today.
            presenceByRoll.put(roll,
                    todayPresenceByEnrollment.getOrDefault(e.getId(), "A"));

            // Walk all attendance rows for this enrollment to accumulate
            // absent and late hours (each row stores its own durationHrs).
            double absHrs = 0.0, lateHrs = 0.0;
            for (Attendance a : attendanceRepository.findByEnrollmentId(e.getId())) {
                if (a.getPresence() == null) continue;
                Double dur = a.getDurationHrs();
                double hrs = (dur != null) ? dur : sessionDuration;
                if ("A".equals(a.getPresence())) absHrs += hrs;
                else if ("L".equals(a.getPresence())) lateHrs += hrs;
            }
            absentHoursByRoll.put(roll, absHrs);
            lateHoursByRoll.put(roll, lateHrs);
        }

        byte[] filled = com.nuked.portal.excel.AttendanceTemplateFiller.fill(
                t.getFileBytes(), lectureDate, presenceByRoll,
                absentHoursByRoll, lateHoursByRoll);
        String filename = "attendance-" + fs.getCourse().getCode() + "-" + fs.getSection()
                + "-" + lectureDate.format(java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy")) + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(filled);
    }

    /** Per-session attendance xlsx — just that one lecture's roster. */
    @GetMapping("/attendance/sessions/{sessionId}/export")
    public ResponseEntity<byte[]> exportSession(Authentication auth,
                                                @PathVariable Long sessionId) throws IOException {
        AttendanceSession s = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown session " + sessionId));
        FacultySection fs = facultyService.ownedSection(auth.getName(), s.getFacultySection().getId());
        List<Enrollment> enrolled = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                fs.getCourse().getId(), fs.getSection(), fs.getSemester());

        try (org.apache.poi.xssf.usermodel.XSSFWorkbook wb = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.xssf.usermodel.XSSFSheet sheet = wb.createSheet("Session");
            sheet.createRow(0).createCell(0).setCellValue("FAST-NUCES Attendance");
            org.apache.poi.ss.usermodel.Row r2 = sheet.createRow(1);
            r2.createCell(0).setCellValue("Course");  r2.createCell(1).setCellValue(fs.getCourse().getCode());
            org.apache.poi.ss.usermodel.Row r3 = sheet.createRow(2);
            r3.createCell(0).setCellValue("Section"); r3.createCell(1).setCellValue(fs.getSection());
            org.apache.poi.ss.usermodel.Row r4 = sheet.createRow(3);
            r4.createCell(0).setCellValue("Lecture"); r4.createCell(1).setCellValue(s.getLectureNo() == null ? "" : s.getLectureNo().toString());
            org.apache.poi.ss.usermodel.Row r5 = sheet.createRow(4);
            r5.createCell(0).setCellValue("Date");    r5.createCell(1).setCellValue(s.getLectureDate() == null ? "" : s.getLectureDate().toString());
            org.apache.poi.ss.usermodel.Row r6 = sheet.createRow(5);
            r6.createCell(0).setCellValue("Topic");   r6.createCell(1).setCellValue(s.getTopic() == null ? "" : s.getTopic());

            org.apache.poi.ss.usermodel.Row hdr = sheet.createRow(7);
            String[] headers = {"#", "Roll", "Name", "Status", "Method"};
            for (int i = 0; i < headers.length; i++) hdr.createCell(i).setCellValue(headers[i]);

            int row = 8, idx = 1;
            for (Enrollment e : enrolled) {
                if (e.getStudent() == null) continue;
                org.apache.poi.ss.usermodel.Row r = sheet.createRow(row++);
                Attendance a = attendanceRepository.findBySessionIdAndEnrollmentId(s.getId(), e.getId()).orElse(null);
                String presence = a == null ? "—" : (a.getPresence() == null ? "—" : a.getPresence());
                String method = a == null ? "—" : (a.getMethod() == null ? "—" : a.getMethod());
                r.createCell(0).setCellValue(idx++);
                r.createCell(1).setCellValue(e.getStudent().getRollNo());
                r.createCell(2).setCellValue(e.getStudent().getName());
                r.createCell(3).setCellValue(presence);
                r.createCell(4).setCellValue(method);
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            wb.write(out);
            String filename = "attendance-session-" + sessionId + ".xlsx";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(out.toByteArray());
        }
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
            m.put("id", s.getId());
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
            // Live-session fields — needed so the faculty UI can restore the
            // active PIN window after a page refresh.
            m.put("startedAt", s.getStartedAt() == null ? null : s.getStartedAt().toString());
            m.put("endsAt", s.getEndsAt() == null ? null : s.getEndsAt().toString());
            m.put("durationMinutes", s.getDurationMinutes());
            m.put("sessionToken", s.getSessionToken());
            m.put("pinCode", s.getPinCode());
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }
}
