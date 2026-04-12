package com.nuked.portal.controller;

import com.nuked.portal.dto.AttendanceDTO;
import com.nuked.portal.model.Student;
import com.nuked.portal.service.AttendanceService;
import com.nuked.portal.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<List<AttendanceDTO>> getAttendance(
            Authentication auth,
            @RequestParam(defaultValue = "Spring 2026") String semester) {
        Student student = studentService.findByRollNo(auth.getName());
        List<AttendanceDTO> attendance = attendanceService.getAttendanceBySemester(student.getId(), semester);
        return ResponseEntity.ok(attendance);
    }
}
