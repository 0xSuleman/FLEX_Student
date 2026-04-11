package com.flex.student.service;

import com.flex.student.model.FeeChallan;
import com.flex.student.model.FeeDetail;
import com.flex.student.model.Student;
import com.flex.student.repository.FeeChallanRepository;
import com.flex.student.repository.FeeDetailRepository;
import com.flex.student.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class FeeService {

    private final FeeChallanRepository feeChallanRepository;
    private final FeeDetailRepository feeDetailRepository;
    private final StudentRepository studentRepository;

    public FeeService(FeeChallanRepository feeChallanRepository,
                      FeeDetailRepository feeDetailRepository,
                      StudentRepository studentRepository) {
        this.feeChallanRepository = feeChallanRepository;
        this.feeDetailRepository = feeDetailRepository;
        this.studentRepository = studentRepository;
    }

    public List<FeeChallan> getChallans(Long studentId) {
        return feeChallanRepository.findByStudentId(studentId);
    }

    public List<FeeDetail> getChallanDetails(Long challanId) {
        return feeDetailRepository.findByFeeChallanId(challanId);
    }

    public FeeChallan generateChallan(Long studentId, String semester, Double amount) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        FeeChallan challan = new FeeChallan();
        challan.setStudent(student);
        challan.setSemester(semester);
        challan.setChallanNo("CH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        challan.setAmount(amount);
        challan.setDueDate(LocalDate.now().plusDays(30));
        challan.setStatus(FeeChallan.ChallanStatus.UNPAID);
        challan.setGeneratedDate(LocalDate.now());

        return feeChallanRepository.save(challan);
    }
}
