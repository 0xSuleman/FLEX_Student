package com.nuked.portal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nuked.portal.model.*;
import com.nuked.portal.repository.*;
import com.nuked.portal.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class RequestController {

    private final StudentService studentService;
    private final EnrollmentRepository enrollmentRepository;
    private final RetakeExamRequestRepository retakeExamRequestRepository;
    private final CourseWithdrawRequestRepository courseWithdrawRequestRepository;
    private final GradeChangeRequestRepository gradeChangeRequestRepository;
    private final ObjectMapper objectMapper;

    @PostMapping("/retake")
    public ResponseEntity<Map<String, String>> submitRetakeRequest(
            Authentication auth,
            @RequestParam String semester,
            @RequestParam String evalType,
            @RequestParam String courses,
            @RequestParam String reason,
            @RequestParam(required = false) MultipartFile document) {

        Student student = studentService.findByRollNo(auth.getName());

        try {
            List<String> courseCodes = objectMapper.readValue(courses,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));

            List<Enrollment> enrollments = enrollmentRepository.findByStudentIdAndSemester(student.getId(), semester);

            Set<String> codeSet = new HashSet<>(courseCodes);
            List<Enrollment> matchedEnrollments = enrollments.stream()
                    .filter(e -> codeSet.contains(e.getCourse().getCode()))
                    .collect(Collectors.toList());

            for (Enrollment enrollment : matchedEnrollments) {
                RetakeExamRequest request = new RetakeExamRequest();
                request.setEnrollment(enrollment);
                request.setEvaluationType(Marks.EvaluationType.valueOf(evalType.toUpperCase().replace(" ", "_")));
                request.setReason(reason);
                request.setStatus(RetakeExamRequest.RequestStatus.PENDING);
                request.setRequestDate(LocalDate.now());

                if (document != null && !document.isEmpty()) {
                    request.setDocumentPath(document.getOriginalFilename());
                }

                retakeExamRequestRepository.save(request);
            }

            return ResponseEntity.ok(Map.of("message", "Retake request submitted successfully"));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to process request: " + e.getMessage()));
        }
    }

    @PostMapping("/withdraw")
    public ResponseEntity<Map<String, String>> submitWithdrawRequest(
            Authentication auth,
            @RequestParam String courses,
            @RequestParam(required = false) MultipartFile form) {

        Student student = studentService.findByRollNo(auth.getName());

        try {
            List<String> courseCodes = objectMapper.readValue(courses,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));

            List<Enrollment> allEnrollments = enrollmentRepository.findByStudentId(student.getId());

            Set<String> codeSet = new HashSet<>(courseCodes);
            List<Enrollment> matchedEnrollments = allEnrollments.stream()
                    .filter(e -> codeSet.contains(e.getCourse().getCode()))
                    .collect(Collectors.toList());

            for (Enrollment enrollment : matchedEnrollments) {
                CourseWithdrawRequest request = new CourseWithdrawRequest();
                request.setEnrollment(enrollment);
                request.setStatus(RetakeExamRequest.RequestStatus.PENDING);
                request.setRequestDate(LocalDate.now());

                if (form != null && !form.isEmpty()) {
                    request.setDocumentPath(form.getOriginalFilename());
                }

                courseWithdrawRequestRepository.save(request);

                // Update enrollment status
                enrollment.setStatus("WITHDRAW_PENDING");
                enrollmentRepository.save(enrollment);
            }

            return ResponseEntity.ok(Map.of("message", "Withdraw request submitted successfully"));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to process request: " + e.getMessage()));
        }
    }

    @PostMapping("/grade-change")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, String>> submitGradeChangeRequest(
            Authentication auth,
            @RequestBody Map<String, Object> request) {

        Student student = studentService.findByRollNo(auth.getName());

        String semester = (String) request.get("semester");
        List<String> courseCodes = (List<String>) request.get("courses");

        List<Enrollment> enrollments = enrollmentRepository.findByStudentIdAndSemester(student.getId(), semester);

        Set<String> codeSet = new HashSet<>(courseCodes);
        List<Enrollment> matchedEnrollments = enrollments.stream()
                .filter(e -> codeSet.contains(e.getCourse().getCode()))
                .collect(Collectors.toList());

        for (Enrollment enrollment : matchedEnrollments) {
            GradeChangeRequest gradeChangeRequest = new GradeChangeRequest();
            gradeChangeRequest.setEnrollment(enrollment);
            gradeChangeRequest.setStatus(RetakeExamRequest.RequestStatus.PENDING);
            gradeChangeRequest.setRequestDate(LocalDate.now());

            gradeChangeRequestRepository.save(gradeChangeRequest);
        }

        return ResponseEntity.ok(Map.of("message", "Grade change request submitted successfully"));
    }
}
