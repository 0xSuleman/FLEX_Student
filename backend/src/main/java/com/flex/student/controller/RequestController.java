package com.flex.student.controller;

import com.flex.student.model.CourseWithdrawRequest;
import com.flex.student.model.GradeChangeRequest;
import com.flex.student.model.RetakeExamRequest;
import com.flex.student.model.Student;
import com.flex.student.service.RequestService;
import com.flex.student.service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    private final RequestService requestService;
    private final StudentService studentService;

    public RequestController(RequestService requestService, StudentService studentService) {
        this.requestService = requestService;
        this.studentService = studentService;
    }

    @PostMapping("/retake")
    public ResponseEntity<RetakeExamRequest> createRetakeRequest(@RequestBody Map<String, Object> request) {
        Long enrollmentId = Long.valueOf(request.get("enrollmentId").toString());
        String evaluationType = (String) request.get("evaluationType");
        String reason = (String) request.get("reason");
        RetakeExamRequest result = requestService.createRetakeRequest(enrollmentId, evaluationType, reason);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/withdraw")
    public ResponseEntity<CourseWithdrawRequest> createWithdrawRequest(@RequestBody Map<String, Long> request) {
        CourseWithdrawRequest result = requestService.createWithdrawRequest(request.get("enrollmentId"));
        return ResponseEntity.ok(result);
    }

    @PostMapping("/grade-change")
    public ResponseEntity<GradeChangeRequest> createGradeChangeRequest(@RequestBody Map<String, Long> request) {
        GradeChangeRequest result = requestService.createGradeChangeRequest(request.get("enrollmentId"));
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getRequests(Authentication authentication) {
        Student student = studentService.findByRollNo(authentication.getName());
        Map<String, Object> requests = requestService.getRequests(student.getId());
        return ResponseEntity.ok(requests);
    }
}
