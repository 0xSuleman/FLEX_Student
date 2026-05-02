package com.nuked.portal.service;

import com.nuked.portal.dto.RetakeRequestDTO;
import com.nuked.portal.dto.StaffDecisionRequest;
import com.nuked.portal.dto.WithdrawalDTO;
import com.nuked.portal.model.*;
import com.nuked.portal.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WithdrawalRoutingService {

    private final CourseWithdrawRequestRepository withdrawRepository;
    private final RetakeExamRequestRepository retakeRepository;
    private final FacultySectionRepository facultySectionRepository;
    private final FacultyService facultyService;
    private final EnrollmentRepository enrollmentRepository;

    // ── Withdrawals ──

    /** Faculty's pending withdrawals — only for sections this faculty owns. */
    @Transactional
    public List<WithdrawalDTO> facultyPending(String username) {
        Faculty fac = facultyService.currentFaculty(username);
        List<FacultySection> mySections = facultySectionRepository.findByFacultyId(fac.getId());
        Set<String> myKeys = mySections.stream()
                .map(s -> key(s.getCourse().getId(), s.getSection(), s.getSemester()))
                .collect(Collectors.toSet());

        return withdrawRepository
                .findByStateOrderByRequestDateAsc(CourseWithdrawRequest.WithdrawState.PENDING_FACULTY)
                .stream()
                .filter(w -> {
                    Enrollment e = w.getEnrollment();
                    if (e == null || e.getCourse() == null) return false;
                    return myKeys.contains(key(e.getCourse().getId(), e.getSection(), e.getSemester()));
                })
                .map(WithdrawalRoutingService::toWithdrawalDto)
                .toList();
    }

    /** Faculty recommends APPROVE → routes to HOD; REJECT → final. */
    @Transactional
    public WithdrawalDTO facultyRecommend(String username, Long requestId, StaffDecisionRequest req) {
        Faculty fac = facultyService.currentFaculty(username);
        CourseWithdrawRequest w = withdrawRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown withdrawal " + requestId));

        // Defense in depth: faculty must own the section.
        Enrollment e = w.getEnrollment();
        boolean owns = facultySectionRepository.findByFacultyId(fac.getId()).stream()
                .anyMatch(s -> s.getCourse().getId().equals(e.getCourse().getId())
                        && Objects.equals(s.getSection(), e.getSection())
                        && Objects.equals(s.getSemester(), e.getSemester()));
        if (!owns) throw new AccessDeniedException("Not your section");

        if (w.getState() != CourseWithdrawRequest.WithdrawState.PENDING_FACULTY) {
            throw new IllegalStateException("Withdrawal is " + w.getState() + ", not PENDING_FACULTY");
        }

        String action = req == null ? null : req.getAction();
        if ("APPROVE".equalsIgnoreCase(action)) {
            w.setFacultyRecommendation(CourseWithdrawRequest.FacultyRecommendation.APPROVE);
            w.setState(CourseWithdrawRequest.WithdrawState.PENDING_HOD);
        } else if ("REJECT".equalsIgnoreCase(action)) {
            w.setFacultyRecommendation(CourseWithdrawRequest.FacultyRecommendation.REJECT);
            w.setState(CourseWithdrawRequest.WithdrawState.REJECTED);
            w.setStatus(RetakeExamRequest.RequestStatus.REJECTED);
            // Roll enrollment status back so the student can register again.
            e.setStatus("IN_PROGRESS");
            enrollmentRepository.save(e);
        } else {
            throw new IllegalArgumentException("Action must be APPROVE or REJECT");
        }
        w.setFacultyRemarks(req.getRemarks());
        w.setFacultyActedAt(LocalDateTime.now());
        return toWithdrawalDto(withdrawRepository.save(w));
    }

    /** HOD's pending withdrawals — those forwarded by faculty. */
    @Transactional
    public List<WithdrawalDTO> hodPending() {
        return withdrawRepository
                .findByStateOrderByRequestDateAsc(CourseWithdrawRequest.WithdrawState.PENDING_HOD)
                .stream()
                .map(WithdrawalRoutingService::toWithdrawalDto)
                .toList();
    }

    @Transactional
    public WithdrawalDTO hodDecide(Long requestId, StaffDecisionRequest req) {
        CourseWithdrawRequest w = withdrawRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown withdrawal " + requestId));
        if (w.getState() != CourseWithdrawRequest.WithdrawState.PENDING_HOD) {
            throw new IllegalStateException("Withdrawal is " + w.getState() + ", not PENDING_HOD");
        }
        String action = req == null ? null : req.getAction();
        Enrollment e = w.getEnrollment();
        if ("APPROVE".equalsIgnoreCase(action)) {
            w.setState(CourseWithdrawRequest.WithdrawState.APPROVED);
            w.setStatus(RetakeExamRequest.RequestStatus.APPROVED);
            e.setStatus("WITHDRAWN");
            e.setGrade("W");
        } else if ("REJECT".equalsIgnoreCase(action)) {
            w.setState(CourseWithdrawRequest.WithdrawState.REJECTED);
            w.setStatus(RetakeExamRequest.RequestStatus.REJECTED);
            e.setStatus("IN_PROGRESS");
        } else {
            throw new IllegalArgumentException("Action must be APPROVE or REJECT");
        }
        enrollmentRepository.save(e);
        w.setHodRemarks(req.getRemarks());
        w.setHodActedAt(LocalDateTime.now());
        return toWithdrawalDto(withdrawRepository.save(w));
    }

    // ── Retakes ──

    @Transactional
    public List<RetakeRequestDTO> retakesPending() {
        return retakeRepository
                .findByStatusOrderByRequestDateAsc(RetakeExamRequest.RequestStatus.PENDING)
                .stream()
                .map(WithdrawalRoutingService::toRetakeDto)
                .toList();
    }

    @Transactional
    public RetakeRequestDTO retakeDecide(Long requestId, StaffDecisionRequest req) {
        RetakeExamRequest r = retakeRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown retake request " + requestId));
        if (r.getStatus() != RetakeExamRequest.RequestStatus.PENDING) {
            throw new IllegalStateException("Retake is " + r.getStatus() + ", not PENDING");
        }
        String action = req == null ? null : req.getAction();
        if ("APPROVE".equalsIgnoreCase(action)) {
            r.setStatus(RetakeExamRequest.RequestStatus.APPROVED);
        } else if ("REJECT".equalsIgnoreCase(action)) {
            r.setStatus(RetakeExamRequest.RequestStatus.REJECTED);
        } else {
            throw new IllegalArgumentException("Action must be APPROVE or REJECT");
        }
        r.setHodRemarks(req.getRemarks());
        r.setDecidedAt(LocalDateTime.now());
        return toRetakeDto(retakeRepository.save(r));
    }

    // ── Mappers ──

    private static String key(Long courseId, String section, String semester) {
        return courseId + "|" + section + "|" + semester;
    }

    private static WithdrawalDTO toWithdrawalDto(CourseWithdrawRequest w) {
        WithdrawalDTO d = new WithdrawalDTO();
        d.setId(w.getId());
        Enrollment e = w.getEnrollment();
        if (e != null) {
            d.setEnrollmentId(e.getId());
            if (e.getStudent() != null) {
                d.setStudentRollNo(e.getStudent().getRollNo());
                d.setStudentName(e.getStudent().getName());
            }
            if (e.getCourse() != null) {
                d.setCourseCode(e.getCourse().getCode());
                d.setCourseName(e.getCourse().getName());
            }
            d.setSection(e.getSection());
            d.setSemester(e.getSemester());
        }
        d.setState(w.getState() == null ? null : w.getState().name());
        d.setFacultyRecommendation(w.getFacultyRecommendation() == null ? null : w.getFacultyRecommendation().name());
        d.setFacultyRemarks(w.getFacultyRemarks());
        d.setHodRemarks(w.getHodRemarks());
        d.setRequestDate(w.getRequestDate() == null ? null : w.getRequestDate().toString());
        d.setDocumentPath(w.getDocumentPath());
        return d;
    }

    private static RetakeRequestDTO toRetakeDto(RetakeExamRequest r) {
        RetakeRequestDTO d = new RetakeRequestDTO();
        d.setId(r.getId());
        Enrollment e = r.getEnrollment();
        if (e != null) {
            d.setEnrollmentId(e.getId());
            if (e.getStudent() != null) {
                d.setStudentRollNo(e.getStudent().getRollNo());
                d.setStudentName(e.getStudent().getName());
            }
            if (e.getCourse() != null) {
                d.setCourseCode(e.getCourse().getCode());
                d.setCourseName(e.getCourse().getName());
            }
            d.setSection(e.getSection());
            d.setSemester(e.getSemester());
        }
        d.setEvaluationType(r.getEvaluationType() == null ? null : r.getEvaluationType().name());
        d.setReason(r.getReason());
        d.setStatus(r.getStatus() == null ? null : r.getStatus().name());
        d.setHodRemarks(r.getHodRemarks());
        d.setRequestDate(r.getRequestDate() == null ? null : r.getRequestDate().toString());
        d.setDocumentPath(r.getDocumentPath());
        return d;
    }
}
