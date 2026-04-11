package com.flex.student.service;

import com.flex.student.dto.AttendanceDTO;
import com.flex.student.model.Attendance;
import com.flex.student.model.Enrollment;
import com.flex.student.repository.AttendanceRepository;
import com.flex.student.repository.EnrollmentRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;

    public AttendanceService(EnrollmentRepository enrollmentRepository, AttendanceRepository attendanceRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.attendanceRepository = attendanceRepository;
    }

    public List<AttendanceDTO> getAttendanceBySemester(Long studentId, String semester) {
        List<Enrollment> enrollments = enrollmentRepository.findByStudentIdAndSemester(studentId, semester);
        List<AttendanceDTO> result = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            List<Attendance> records = attendanceRepository.findByEnrollmentId(enrollment.getId());
            if (records.isEmpty()) continue;

            AttendanceDTO dto = new AttendanceDTO();
            dto.setCourseCode(enrollment.getCourse().getCode());
            dto.setCourseName(enrollment.getCourse().getName());
            dto.setSemester(semester);
            dto.setTotalLectures(records.size());

            int present = 0, absent = 0, leaves = 0;
            for (Attendance a : records) {
                switch (a.getPresence()) {
                    case "P" -> present++;
                    case "A" -> absent++;
                    case "L" -> leaves++;
                }
            }
            dto.setPresent(present);
            dto.setAbsent(absent);
            dto.setLeaves(leaves);
            dto.setPercentage(records.isEmpty() ? 0 : Math.round((present * 100.0 / records.size()) * 100.0) / 100.0);

            List<AttendanceDTO.AttendanceRecordDTO> recordDTOs = records.stream().map(a -> {
                AttendanceDTO.AttendanceRecordDTO r = new AttendanceDTO.AttendanceRecordDTO();
                r.setLectureNo(a.getLectureNo());
                r.setDate(a.getDate() != null ? a.getDate().toString() : null);
                r.setDurationHrs(a.getDurationHrs());
                r.setPresence(a.getPresence());
                return r;
            }).collect(Collectors.toList());
            dto.setRecords(recordDTOs);

            result.add(dto);
        }

        return result;
    }
}
