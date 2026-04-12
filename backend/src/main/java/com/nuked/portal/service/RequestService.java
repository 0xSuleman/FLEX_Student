package com.nuked.portal.service;

import com.nuked.portal.model.CourseWithdrawRequest;
import com.nuked.portal.model.Enrollment;
import com.nuked.portal.model.GradeChangeRequest;
import com.nuked.portal.model.Marks;
import com.nuked.portal.model.RetakeExamRequest;
import com.nuked.portal.repository.CourseWithdrawRequestRepository;
import com.nuked.portal.repository.EnrollmentRepository;
import com.nuked.portal.repository.GradeChangeRequestRepository;
import com.nuked.portal.repository.RetakeExamRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RequestService {

    private final RetakeExamRequestRepository retakeExamRequestRepository;
    private final CourseWithdrawRequestRepository courseWithdrawRequestRepository;
    private final GradeChangeRequestRepository gradeChangeRequestRepository;
    private final EnrollmentRepository enrollmentRepository;

    public List<RetakeExamRequest> createRetakeRequests(List<Long> enrollmentIds, String evalType, String reason) {
        List<RetakeExamRequest> result = new ArrayList<>();

        for (Long enrollmentId : enrollmentIds) {
            Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                    .orElseThrow(() -> new RuntimeException("Enrollment not found with id: " + enrollmentId));

            RetakeExamRequest request = new RetakeExamRequest();
            request.setEnrollment(enrollment);
            request.setEvaluationType(Marks.EvaluationType.valueOf(evalType));
            request.setReason(reason);
            request.setStatus(RetakeExamRequest.RequestStatus.PENDING);
            request.setRequestDate(LocalDate.now());

            result.add(retakeExamRequestRepository.save(request));
        }

        return result;
    }

    public List<CourseWithdrawRequest> createWithdrawRequests(List<Long> enrollmentIds) {
        List<CourseWithdrawRequest> result = new ArrayList<>();

        for (Long enrollmentId : enrollmentIds) {
            Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                    .orElseThrow(() -> new RuntimeException("Enrollment not found with id: " + enrollmentId));

            CourseWithdrawRequest request = new CourseWithdrawRequest();
            request.setEnrollment(enrollment);
            request.setStatus(RetakeExamRequest.RequestStatus.PENDING);
            request.setRequestDate(LocalDate.now());

            result.add(courseWithdrawRequestRepository.save(request));
        }

        return result;
    }

    public List<GradeChangeRequest> createGradeChangeRequests(List<Long> enrollmentIds) {
        List<GradeChangeRequest> result = new ArrayList<>();

        for (Long enrollmentId : enrollmentIds) {
            Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                    .orElseThrow(() -> new RuntimeException("Enrollment not found with id: " + enrollmentId));

            GradeChangeRequest request = new GradeChangeRequest();
            request.setEnrollment(enrollment);
            request.setStatus(RetakeExamRequest.RequestStatus.PENDING);
            request.setRequestDate(LocalDate.now());

            result.add(gradeChangeRequestRepository.save(request));
        }

        return result;
    }
}
