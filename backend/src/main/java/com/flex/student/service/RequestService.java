package com.flex.student.service;

import com.flex.student.model.*;
import com.flex.student.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RequestService {

    private final RetakeExamRequestRepository retakeExamRequestRepository;
    private final CourseWithdrawRequestRepository courseWithdrawRequestRepository;
    private final GradeChangeRequestRepository gradeChangeRequestRepository;
    private final EnrollmentRepository enrollmentRepository;

    public RequestService(RetakeExamRequestRepository retakeExamRequestRepository,
                          CourseWithdrawRequestRepository courseWithdrawRequestRepository,
                          GradeChangeRequestRepository gradeChangeRequestRepository,
                          EnrollmentRepository enrollmentRepository) {
        this.retakeExamRequestRepository = retakeExamRequestRepository;
        this.courseWithdrawRequestRepository = courseWithdrawRequestRepository;
        this.gradeChangeRequestRepository = gradeChangeRequestRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    public RetakeExamRequest createRetakeRequest(Long enrollmentId, String evaluationType, String reason) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        RetakeExamRequest request = new RetakeExamRequest();
        request.setEnrollment(enrollment);
        request.setEvaluationType(Marks.EvaluationType.valueOf(evaluationType));
        request.setReason(reason);
        request.setStatus(RetakeExamRequest.RequestStatus.PENDING);
        request.setRequestDate(LocalDate.now());

        return retakeExamRequestRepository.save(request);
    }

    public CourseWithdrawRequest createWithdrawRequest(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        CourseWithdrawRequest request = new CourseWithdrawRequest();
        request.setEnrollment(enrollment);
        request.setStatus(RetakeExamRequest.RequestStatus.PENDING);
        request.setRequestDate(LocalDate.now());

        return courseWithdrawRequestRepository.save(request);
    }

    public GradeChangeRequest createGradeChangeRequest(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        GradeChangeRequest request = new GradeChangeRequest();
        request.setEnrollment(enrollment);
        request.setStatus(RetakeExamRequest.RequestStatus.PENDING);
        request.setRequestDate(LocalDate.now());

        return gradeChangeRequestRepository.save(request);
    }

    public Map<String, Object> getRequests(Long studentId) {
        Map<String, Object> requests = new HashMap<>();
        requests.put("retakeExamRequests", retakeExamRequestRepository.findByEnrollmentStudentId(studentId));
        requests.put("courseWithdrawRequests", courseWithdrawRequestRepository.findByEnrollmentStudentId(studentId));
        requests.put("gradeChangeRequests", gradeChangeRequestRepository.findByEnrollmentStudentId(studentId));
        return requests;
    }
}
