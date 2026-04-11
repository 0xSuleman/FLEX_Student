package com.flex.student.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class DashboardDTO {
    private Map<String, String> universityInfo;
    private List<AcademicCalendarDTO> academicCalendar;
    private StudentProfileDTO personalInfo;
    private ContactInfoDTO contactInfo;
    private List<FamilyInfoDTO> familyInfo;

    @Data
    public static class AcademicCalendarDTO {
        private Long id;
        private String eventName;
        private String startDate;
        private String endDate;
    }

    @Data
    public static class ContactInfoDTO {
        private Long id;
        private String address;
        private String city;
        private String postalCode;
        private String phone;
        private String emergencyContact;
    }

    @Data
    public static class FamilyInfoDTO {
        private Long id;
        private String relation;
        private String name;
        private String cnic;
        private String taxWithholding;
    }
}
