package com.nuked.portal.controller;

import com.nuked.portal.model.*;
import com.nuked.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * HOD-wide reads: dashboard aggregates, dept section directory, monitoring,
 * late-reg passthrough. All read-only.
 */
@RestController
@RequestMapping("/api/hod")
@RequiredArgsConstructor
public class HodOverviewController {

    private final StaffUserRepository staffUserRepository;
    private final FacultySectionRepository facultySectionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final GradeSubmissionRepository gradeSubmissionRepository;
    private final CourseWithdrawRequestRepository withdrawRepository;
    private final RetakeExamRequestRepository retakeRepository;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication auth) {
        StaffUser u = staffUserRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalStateException("Unknown HOD: " + auth.getName()));
        return ResponseEntity.ok(Map.of(
                "username", u.getUsername(),
                "name", u.getName(),
                "designation", str(u.getDesignation()),
                "department", str(u.getDepartment()),
                "campus", str(u.getCampus())));
    }

    /**
     * Dashboard: counts of pending workflow items + dept-level totals so the
     * UI doesn't need 4 separate calls.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        Map<String, Object> out = new LinkedHashMap<>();

        long pendingGrades = gradeSubmissionRepository
                .findByStateOrderBySubmittedAtAsc(GradeSubmission.State.SUBMITTED).size();
        long pendingWithdrawals = withdrawRepository
                .findByStateOrderByRequestDateAsc(CourseWithdrawRequest.WithdrawState.PENDING_HOD).size();
        long pendingRetakes = retakeRepository
                .findByStatusOrderByRequestDateAsc(RetakeExamRequest.RequestStatus.PENDING).size();

        out.put("pendingGradeApprovals", pendingGrades);
        out.put("pendingWithdrawals", pendingWithdrawals);
        out.put("pendingRetakes", pendingRetakes);
        out.put("pendingLateRegistration", 0L);     // not yet wired

        // Dept-wide totals for the current semester (use most-common semester
        // across faculty sections — keeps the demo from hardcoding "Spring 2026").
        List<FacultySection> all = facultySectionRepository.findAll();
        Map<String, Long> bySemester = new HashMap<>();
        for (FacultySection s : all) bySemester.merge(s.getSemester(), 1L, Long::sum);
        String currentSem = bySemester.entrySet().stream()
                .max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(null);
        out.put("currentSemester", currentSem);
        out.put("totalSections", all.size());

        Set<String> faculties = new HashSet<>();
        for (FacultySection s : all) if (s.getFaculty() != null) faculties.add(s.getFaculty().getUsername());
        out.put("totalFaculty", faculties.size());

        return ResponseEntity.ok(out);
    }

    /**
     * Dept section directory — every section assigned in the current semester,
     * with course/faculty/enrollment count.
     */
    @GetMapping("/sections")
    public ResponseEntity<List<Map<String, Object>>> sections(@RequestParam(required = false) String semester) {
        List<FacultySection> rows = facultySectionRepository.findAll().stream()
                .filter(s -> semester == null || semester.isBlank() || semester.equals(s.getSemester()))
                .toList();
        List<Map<String, Object>> out = new ArrayList<>();
        for (FacultySection s : rows) {
            int enrolled = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                    s.getCourse().getId(), s.getSection(), s.getSemester()).size();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("sectionId", s.getId());
            m.put("courseCode", s.getCourse().getCode());
            m.put("courseName", s.getCourse().getName());
            m.put("section", s.getSection());
            m.put("semester", s.getSemester());
            m.put("facultyName", s.getFaculty() == null ? null : s.getFaculty().getName());
            m.put("dayPattern", s.getDayPattern());
            m.put("timeSlot", s.getTimeSlot());
            m.put("room", s.getRoom());
            m.put("enrolled", enrolled);
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    /**
     * Monitoring (req 5.3): per-section attendance % and grade-submission state.
     * Aggregates from existing tables; no new schema.
     */
    @GetMapping("/monitoring")
    public ResponseEntity<List<Map<String, Object>>> monitoring(@RequestParam(required = false) String semester) {
        List<FacultySection> rows = facultySectionRepository.findAll().stream()
                .filter(s -> semester == null || semester.isBlank() || semester.equals(s.getSemester()))
                .toList();
        List<Map<String, Object>> out = new ArrayList<>();
        for (FacultySection s : rows) {
            List<Enrollment> enrolled = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                    s.getCourse().getId(), s.getSection(), s.getSemester());

            int total = 0, present = 0;
            for (Enrollment e : enrolled) {
                List<Attendance> rec = attendanceRepository.findByEnrollmentId(e.getId());
                total += rec.size();
                for (Attendance a : rec) if ("P".equals(a.getPresence())) present++;
            }
            double avgAtt = total == 0 ? 0 : (100.0 * present / total);

            String gradeState = gradeSubmissionRepository.findByFacultySectionId(s.getId())
                    .map(g -> g.getState().name()).orElse("DRAFT");

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("sectionId", s.getId());
            m.put("courseCode", s.getCourse().getCode());
            m.put("section", s.getSection());
            m.put("facultyName", s.getFaculty() == null ? null : s.getFaculty().getName());
            m.put("enrolled", enrolled.size());
            m.put("avgAttendance", Math.round(avgAtt * 10) / 10.0);
            m.put("gradeState", gradeState);
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    /**
     * Late registration listing — placeholder. Late-reg lives primarily under
     * the AO workflow per the AO interview; HOD has a read-only view here.
     * Returns empty until late-reg entity exists.
     */
    @GetMapping("/late-registration")
    public ResponseEntity<List<Map<String, Object>>> lateReg() {
        return ResponseEntity.ok(List.of());
    }

    private static String str(String s) { return s == null ? "—" : s; }
}
