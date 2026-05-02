package com.nuked.portal.controller;

import com.nuked.portal.dto.RetakeRequestDTO;
import com.nuked.portal.dto.StaffDecisionRequest;
import com.nuked.portal.dto.WithdrawalDTO;
import com.nuked.portal.service.WithdrawalRoutingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hod")
@RequiredArgsConstructor
public class HodReviewController {

    private final WithdrawalRoutingService service;

    @GetMapping("/withdrawals")
    public ResponseEntity<List<WithdrawalDTO>> withdrawals() {
        return ResponseEntity.ok(service.hodPending());
    }

    @PostMapping("/withdrawals/{id}/decide")
    public ResponseEntity<WithdrawalDTO> decideWithdrawal(@PathVariable Long id,
                                                          @RequestBody StaffDecisionRequest req) {
        return ResponseEntity.ok(service.hodDecide(id, req));
    }

    @GetMapping("/retakes")
    public ResponseEntity<List<RetakeRequestDTO>> retakes() {
        return ResponseEntity.ok(service.retakesPending());
    }

    @PostMapping("/retakes/{id}/decide")
    public ResponseEntity<RetakeRequestDTO> decideRetake(@PathVariable Long id,
                                                         @RequestBody StaffDecisionRequest req) {
        return ResponseEntity.ok(service.retakeDecide(id, req));
    }
}
