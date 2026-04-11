package com.flex.student.service;

import com.flex.student.dto.DashboardDTO;
import com.flex.student.dto.StudentProfileDTO;
import com.flex.student.model.*;
import com.flex.student.repository.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final AcademicCalendarRepository academicCalendarRepository;
    private final ContactInfoRepository contactInfoRepository;
    private final FamilyInfoRepository familyInfoRepository;

    public StudentService(StudentRepository studentRepository,
                          AcademicCalendarRepository academicCalendarRepository,
                          ContactInfoRepository contactInfoRepository,
                          FamilyInfoRepository familyInfoRepository) {
        this.studentRepository = studentRepository;
        this.academicCalendarRepository = academicCalendarRepository;
        this.contactInfoRepository = contactInfoRepository;
        this.familyInfoRepository = familyInfoRepository;
    }

    public Student findByRollNo(String rollNo) {
        return studentRepository.findByRollNo(rollNo)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    public StudentProfileDTO getProfile(String rollNo) {
        Student student = findByRollNo(rollNo);
        return mapToProfileDTO(student);
    }

    public DashboardDTO getDashboard(String rollNo) {
        Student student = findByRollNo(rollNo);
        DashboardDTO dashboard = new DashboardDTO();

        // University Info
        Map<String, String> universityInfo = new LinkedHashMap<>();
        universityInfo.put("name", "FAST National University of Computer and Emerging Sciences");
        universityInfo.put("shortName", "FAST-NUCES");
        universityInfo.put("campus", student.getCampus());
        universityInfo.put("website", "https://www.nu.edu.pk");
        universityInfo.put("currentSemester", "Spring 2025");
        dashboard.setUniversityInfo(universityInfo);

        // Academic Calendar
        List<AcademicCalendar> calendarEvents = academicCalendarRepository.findAll();
        List<DashboardDTO.AcademicCalendarDTO> calendarDTOs = calendarEvents.stream()
                .map(event -> {
                    DashboardDTO.AcademicCalendarDTO dto = new DashboardDTO.AcademicCalendarDTO();
                    dto.setId(event.getId());
                    dto.setEventName(event.getEventName());
                    dto.setStartDate(event.getStartDate() != null ? event.getStartDate().toString() : null);
                    dto.setEndDate(event.getEndDate() != null ? event.getEndDate().toString() : null);
                    return dto;
                }).collect(Collectors.toList());
        dashboard.setAcademicCalendar(calendarDTOs);

        // Personal Info
        dashboard.setPersonalInfo(mapToProfileDTO(student));

        // Contact Info
        contactInfoRepository.findByStudentId(student.getId()).ifPresent(contact -> {
            DashboardDTO.ContactInfoDTO contactDTO = new DashboardDTO.ContactInfoDTO();
            contactDTO.setId(contact.getId());
            contactDTO.setAddress(contact.getAddress());
            contactDTO.setCity(contact.getCity());
            contactDTO.setPostalCode(contact.getPostalCode());
            contactDTO.setPhone(contact.getPhone());
            contactDTO.setEmergencyContact(contact.getEmergencyContact());
            dashboard.setContactInfo(contactDTO);
        });

        // Family Info
        List<FamilyInfo> familyInfoList = familyInfoRepository.findByStudentId(student.getId());
        List<DashboardDTO.FamilyInfoDTO> familyDTOs = familyInfoList.stream()
                .map(family -> {
                    DashboardDTO.FamilyInfoDTO dto = new DashboardDTO.FamilyInfoDTO();
                    dto.setId(family.getId());
                    dto.setRelation(family.getRelation());
                    dto.setName(family.getName());
                    dto.setCnic(family.getCnic());
                    dto.setTaxWithholding(family.getTaxWithholding());
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
