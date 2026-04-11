package com.flex.student.controller;

import com.flex.student.model.FeeChallan;
import com.flex.student.model.FeeDetail;
import com.flex.student.model.Student;
import com.flex.student.service.FeeService;
import com.flex.student.service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fees")
public class FeeController {

    private final FeeService feeService;
    private final StudentService studentService;

    public FeeController(FeeService feeService, StudentService studentService) {
        this.feeService = feeService;
        this.studentService = studentService;
    }

    @GetMapping("/challans")
    public ResponseEntity<List<FeeChallan>> getChallans(Authentication authentication) {
        Student student = studentService.findByRollNo(authentication.getName());
        List<FeeChallan> challans = feeService.getChallans(student.getId());
        return ResponseEntity.ok(challans);
    }

    @GetMapping("/challans/{id}/details")
    public ResponseEntity<List<FeeDetail>> getChallanDetails(@PathVariable Long id) {
        List<FeeDetail> details = feeService.getChallanDetails(id);
        return ResponseEntity.ok(details);
    }

    @PostMapping("/challans/generate")
    public ResponseEntity<FeeChallan> generateChallan(
            Authentication authentication,
            @RequestBody Map<String, Object> request) {
        Student student = studentService.findByRollNo(authentication.getName());
        String semester = (String) request.get("semester");
        Double amount = Double.valueOf(request.get("amount").toString());
        FeeChallan challan = feeService.generateChallan(student.getId(), semester, amount);
        return ResponseEntity.ok(challan);
    }
}
