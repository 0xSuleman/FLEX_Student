package com.nuked.portal.controller;

import com.nuked.portal.dto.StaffDecisionRequest;
import com.nuked.portal.dto.WithdrawalDTO;
import com.nuked.portal.service.WithdrawalRoutingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/withdrawals")
@RequiredArgsConstructor
public class FacultyWithdrawalController {

    private final WithdrawalRoutingService service;

    @GetMapping
    public ResponseEntity<List<WithdrawalDTO>> pending(Authentication auth) {
        return ResponseEntity.ok(service.facultyPending(auth.getName()));
    }

    @PostMapping("/{id}/recommend")
    public ResponseEntity<WithdrawalDTO> recommend(Authentication auth,
                                                   @PathVariable Long id,
                                                   @RequestBody StaffDecisionRequest req) {
        return ResponseEntity.ok(service.facultyRecommend(auth.getName(), id, req));
    }
}
