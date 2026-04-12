package com.nuked.portal.service;

import com.nuked.portal.dto.DashboardDTO;
import com.nuked.portal.dto.StudentProfileDTO;
import com.nuked.portal.model.AcademicCalendar;
import com.nuked.portal.model.ContactInfo;
import com.nuked.portal.model.FamilyInfo;
import com.nuked.portal.model.Student;
import com.nuked.portal.repository.AcademicCalendarRepository;
import com.nuked.portal.repository.ContactInfoRepository;
import com.nuked.portal.repository.FamilyInfoRepository;
import com.nuked.portal.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final AcademicCalendarRepository academicCalendarRepository;
    private final ContactInfoRepository contactInfoRepository;
    private final FamilyInfoRepository familyInfoRepository;

    public Student findByRollNo(String rollNo) {
        return studentRepository.findByRollNo(rollNo)
                .orElseThrow(() -> new RuntimeException("Student not found with rollNo: " + rollNo));
    }

    public DashboardDTO getDashboard(String rollNo) {
        Student student = findByRollNo(rollNo);
        DashboardDTO dashboard = new DashboardDTO();

        // University info
        Map<String, String> universityInfo = new LinkedHashMap<>();
        universityInfo.put("name", "NUKED University");
        universityInfo.put("campus", student.getCampus());
        universityInfo.put("degree", student.getDegree());
        universityInfo.put("batch", student.getBatch());
        universityInfo.put("section", student.getSection());
        universityInfo.put("status", student.getStatus());
        dashboard.setUniversityInfo(universityInfo);

        // Academic calendar
        List<AcademicCalendar> events = academicCalendarRepository.findAll();
        List<DashboardDTO.AcademicCalendarDTO> calendarDTOs = events.stream().map(event -> {
            DashboardDTO.AcademicCalendarDTO dto = new DashboardDTO.AcademicCalendarDTO();
            dto.setId(event.getId());
            dto.setEventName(event.getEventName());
            dto.setStartDate(event.getStartDate() != null ? event.getStartDate().toString() : null);
            dto.setEndDate(event.getEndDate() != null ? event.getEndDate().toString() : null);
            return dto;
        }).collect(Collectors.toList());
        dashboard.setAcademicCalendar(calendarDTOs);

        // Personal info
        dashboard.setPersonalInfo(mapToProfileDTO(student));

        // Contact info
        ContactInfo contactInfo = contactInfoRepository.findByStudentId(student.getId()).orElse(null);
        if (contactInfo != null) {
            DashboardDTO.ContactInfoDTO contactDTO = new DashboardDTO.ContactInfoDTO();
            contactDTO.setId(contactInfo.getId());
            contactDTO.setAddress(contactInfo.getAddress());
            contactDTO.setCity(contactInfo.getCity());
            contactDTO.setPostalCode(contactInfo.getPostalCode());
            contactDTO.setPhone(contactInfo.getPhone());
            contactDTO.setEmergencyContact(contactInfo.getEmergencyContact());
            dashboard.setContactInfo(contactDTO);
        }

        // Family info
        List<FamilyInfo> familyInfos = familyInfoRepository.findByStudentId(student.getId());
        List<DashboardDTO.FamilyInfoDTO> familyDTOs = familyInfos.stream().map(fi -> {
            DashboardDTO.FamilyInfoDTO dto = new DashboardDTO.FamilyInfoDTO();
            dto.setId(fi.getId());
            dto.setRelation(fi.getRelation());
            dto.setName(fi.getName());
            dto.setCnic(fi.getCnic());
            dto.setTaxWithholding(fi.getTaxWithholding());
            return dto;
        }).collect(Collectors.toList());
        dashboard.setFamilyInfo(familyDTOs);

        return dashboard;
    }

    private StudentProfileDTO mapToProfileDTO(Student student) {
        StudentProfileDTO dto = new StudentProfileDTO();
        dto.setId(student.getId());
        dto.setRollNo(student.getRollNo());
        dto.setName(student.getName());
        dto.setGender(student.getGender());
        dto.setEmail(student.getEmail());
        dto.setDob(student.getDob());
        dto.setCnic(student.getCnic());
        dto.setMobileNo(student.getMobileNo());
        dto.setBloodGroup(student.getBloodGroup());
        dto.setNationality(student.getNationality());
        dto.setDegree(student.getDegree());
        dto.setBatch(student.getBatch());
        dto.setSection(student.getSection());
        dto.setCampus(student.getCampus());
        dto.setStatus(student.getStatus());
        dto.setProfileImageUrl(student.getProfileImageUrl());
        return dto;
    }
}
