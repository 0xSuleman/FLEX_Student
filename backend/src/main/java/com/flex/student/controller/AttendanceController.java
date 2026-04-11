package com.flex.student.controller;

import com.flex.student.dto.AttendanceDTO;
import com.flex.student.model.Student;
import com.flex.student.service.AttendanceService;
import com.flex.student.service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final StudentService studentService;

    public AttendanceController(AttendanceService attendanceService, StudentService studentService) {
        this.attendanceService = attendanceService;
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<List<AttendanceDTO>> getAttendance(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "Fall 2024") String semester) {
        Student student = studentService.findByRollNo(authentication.getName());
        List<AttendanceDTO> attendance = attendanceService.getAttendanceBySemester(student.getId(), semester);
        return ResponseEntity.ok(attendance);
    }
}
