package com.nuked.portal.controller;

import com.nuked.portal.dto.AttendanceSessionDTO;
import com.nuked.portal.dto.CloseSessionRequest;
import com.nuked.portal.dto.FacultySectionDTO;
import com.nuked.portal.dto.OpenSessionRequest;
import com.nuked.portal.dto.RosterEntryDTO;
import com.nuked.portal.model.Faculty;
import com.nuked.portal.service.AttendanceSessionService;
import com.nuked.portal.service.FacultyService;
import com.nuked.portal.service.NetworkCommanderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/faculty")
@RequiredArgsConstructor
public class FacultyController {

    private final FacultyService facultyService;
    private final AttendanceSessionService sessionService;
    private final NetworkCommanderService networkCommanderService;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication auth) {
        Faculty f = facultyService.currentFaculty(auth.getName());
        return ResponseEntity.ok(Map.of(
                "username", f.getUsername(),
                "name", f.getName(),
                "designation", nullToDash(f.getDesignation()),
                "department", nullToDash(f.getDepartment()),
                "employeeId", nullToDash(f.getEmployeeId()),
                "email", nullToDash(f.getEmail()),
                "campus", nullToDash(f.getCampus())));
    }

    @GetMapping("/courses")
    public ResponseEntity<List<FacultySectionDTO>> courses(Authentication auth,
                                                           @RequestParam(required = false) String semester) {
        return ResponseEntity.ok(facultyService.assignedSections(auth.getName(), semester));
    }

    @GetMapping("/sections/{sectionId}/roster")
    public ResponseEntity<List<RosterEntryDTO>> roster(Authentication auth,
                                                       @PathVariable Long sectionId) {
        return ResponseEntity.ok(facultyService.roster(auth.getName(), sectionId));
    }

    @PostMapping("/attendance/sessions")
    public ResponseEntity<AttendanceSessionDTO> openSession(Authentication auth,
                                                            @Valid @RequestBody OpenSessionRequest req) {
        return ResponseEntity.ok(sessionService.open(auth.getName(), req));
    }

    @GetMapping("/attendance/sessions/{id}")
    public ResponseEntity<AttendanceSessionDTO> getSession(Authentication auth,
                                                           @PathVariable Long id) {
        return ResponseEntity.ok(sessionService.get(auth.getName(), id));
    }

    @GetMapping("/attendance/sessions/{id}/marks")
    public ResponseEntity<List<com.nuked.portal.dto.SessionMarkDTO>> sessionMarks(
            Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(sessionService.liveMarks(auth.getName(), id));
    }

    @PostMapping("/attendance/sessions/{id}/close")
    public ResponseEntity<AttendanceSessionDTO> closeSession(Authentication auth,
                                                             @PathVariable Long id,
                                                             @RequestBody(required = false) CloseSessionRequest req) {
        try {
            networkCommanderService.stop(id);
        } catch (RuntimeException ignored) {
            // Attendance close must still save even if the local hotspot daemon
            // is not running or has already auto-stopped.
        }
        return ResponseEntity.ok(sessionService.close(auth.getName(), id, req));
    }

    @PostMapping("/attendance/sessions/{id}/network/start")
    public ResponseEntity<Map<String, Object>> startAttendanceNetwork(Authentication auth,
                                                                      @PathVariable Long id) {
        AttendanceSessionDTO session = sessionService.get(auth.getName(), id);
        return ResponseEntity.ok(networkCommanderService.start(session));
    }

    @PostMapping("/attendance/sessions/{id}/network/stop")
    public ResponseEntity<Map<String, Object>> stopAttendanceNetwork(Authentication auth,
                                                                     @PathVariable Long id) {
        sessionService.get(auth.getName(), id);
        return ResponseEntity.ok(networkCommanderService.stop(id));
    }

    @GetMapping("/attendance/sessions/{id}/network/status")
    public ResponseEntity<Map<String, Object>> attendanceNetworkStatus(Authentication auth,
                                                                       @PathVariable Long id) {
        sessionService.get(auth.getName(), id);
        return ResponseEntity.ok(networkCommanderService.status());
    }

    @DeleteMapping("/attendance/sessions/{id}")
    public ResponseEntity<Void> deleteSession(Authentication auth, @PathVariable Long id) {
        sessionService.deleteSession(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    /** Update P/A/L on a past closed session (req 4.2.4). */
    @PutMapping("/attendance/sessions/{id}/marks")
    public ResponseEntity<AttendanceSessionDTO> updateSessionMarks(Authentication auth,
                                                                   @PathVariable Long id,
                                                                   @RequestBody CloseSessionRequest req) {
        return ResponseEntity.ok(sessionService.updateMarks(auth.getName(), id, req));
    }

    private static String nullToDash(String s) { return s == null ? "—" : s; }
}
