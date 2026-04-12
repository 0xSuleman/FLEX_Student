package com.nuked.portal.service;

import com.nuked.portal.model.FeeChallan;
import com.nuked.portal.model.FeeDetail;
import com.nuked.portal.model.Student;
import com.nuked.portal.repository.FeeChallanRepository;
import com.nuked.portal.repository.FeeDetailRepository;
import com.nuked.portal.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeeService {

    private final FeeChallanRepository feeChallanRepository;
    private final FeeDetailRepository feeDetailRepository;
    private final StudentRepository studentRepository;

    public List<FeeChallan> getChallans(Long studentId) {
        return feeChallanRepository.findByStudentId(studentId);
    }

    public List<FeeDetail> getChallanDetails(Long challanId) {
        return feeDetailRepository.findByFeeChallanId(challanId);
    }

    public FeeChallan generateChallan(Long studentId, String semester, String type) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));

        double amount = switch (type.toLowerCase()) {
            case "tuition" -> 185000;
            case "hostel" -> 50000;
            case "exam" -> 5000;
            default -> 10000;
        };

        FeeChallan challan = new FeeChallan();
        challan.setStudent(student);
        challan.setSemester(semester);
        challan.setChallanNo("CHN-" + UUID.randomUUID().toString());
        challan.setAmount(amount);
        challan.setDueDate(LocalDate.now().plusDays(30));
        challan.setStatus(FeeChallan.ChallanStatus.UNPAID);
        challan.setGeneratedDate(LocalDate.now());

        return feeChallanRepository.save(challan);
    }
}
