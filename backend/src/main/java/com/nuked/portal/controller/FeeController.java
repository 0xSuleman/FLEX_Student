package com.nuked.portal.controller;

import com.nuked.portal.model.FeeChallan;
import com.nuked.portal.model.FeeDetail;
import com.nuked.portal.model.Student;
import com.nuked.portal.repository.FeeChallanRepository;
import com.nuked.portal.repository.FeeDetailRepository;
import com.nuked.portal.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fees")
@RequiredArgsConstructor
public class FeeController {

    private final FeeChallanRepository feeChallanRepository;
    private final FeeDetailRepository feeDetailRepository;
    private final StudentService studentService;

    @GetMapping("/challans")
    public ResponseEntity<List<Map<String, Object>>> getChallans(Authentication auth) {
        Student student = studentService.findByRollNo(auth.getName());
        List<FeeChallan> challans = feeChallanRepository.findByStudentId(student.getId());

        List<Map<String, Object>> result = challans.stream().map(c -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", c.getId());
            map.put("challanNo", c.getChallanNo());
            map.put("semester", c.getSemester());
            map.put("amount", c.getAmount());
            map.put("dueDate", c.getDueDate() != null ? c.getDueDate().toString() : null);
            map.put("status", c.getStatus() != null ? c.getStatus().name() : null);
            map.put("generatedDate", c.getGeneratedDate() != null ? c.getGeneratedDate().toString() : null);
            map.put("paidDate", c.getPaidDate() != null ? c.getPaidDate().toString() : null);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/challans/{id}/details")
    public ResponseEntity<List<Map<String, Object>>> getChallanDetails(@PathVariable Long id) {
        List<FeeDetail> details = feeDetailRepository.findByFeeChallanId(id);

        List<Map<String, Object>> result = details.stream().map(d -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", d.getId());
            map.put("description", d.getDescription());
            map.put("arrears", d.getArrears());
            map.put("due", d.getDue());
            map.put("discount", d.getDiscount());
            map.put("sponsored", d.getSponsored());
            map.put("collection", d.getCollection());
            map.put("balance", d.getBalance());
            map.put("instrumentNo", d.getInstrumentNo());
            map.put("instrumentType", d.getInstrumentType());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/challans")
    public ResponseEntity<Map<String, Object>> generateChallan(
            Authentication auth,
            @RequestBody Map<String, String> request) {
        Student student = studentService.findByRollNo(auth.getName());

        String semester = request.get("semester");
        String type = request.get("type");

        double amount;
        switch (type) {
            case "Hostel Fee" -> amount = 50000;
            case "Exam Fee" -> amount = 5000;
            case "Other" -> amount = 10000;
            default -> amount = 185000;
        }

        FeeChallan challan = new FeeChallan();
        challan.setStudent(student);
        challan.setSemester(semester);
        challan.setChallanNo("CHN-" + LocalDate.now().getYear() + "-" + String.format("%03d", new Random().nextInt(999) + 1));
        challan.setAmount(amount);
        challan.setDueDate(LocalDate.now().plusDays(30));
        challan.setStatus(FeeChallan.ChallanStatus.UNPAID);
        challan.setGeneratedDate(LocalDate.now());
        challan.setPaidDate(null);

        challan = feeChallanRepository.save(challan);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", challan.getId());
        result.put("challanNo", challan.getChallanNo());
        result.put("semester", challan.getSemester());
        result.put("amount", challan.getAmount());
        result.put("dueDate", challan.getDueDate().toString());
        result.put("status", challan.getStatus().name());
        result.put("generatedDate", challan.getGeneratedDate().toString());
        result.put("paidDate", null);

        return ResponseEntity.ok(result);
    }
}
