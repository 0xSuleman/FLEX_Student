package com.nuked.portal.service;

import com.nuked.portal.dto.AttendanceDTO;
import com.nuked.portal.model.Attendance;
import com.nuked.portal.model.Enrollment;
import com.nuked.portal.repository.AttendanceRepository;
import com.nuked.portal.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;

    public List<AttendanceDTO> getAttendanceBySemester(Long studentId, String semester) {
        List<Enrollment> enrollments = enrollmentRepository.findByStudentIdAndSemester(studentId, semester);
        List<AttendanceDTO> result = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            List<Attendance> records = attendanceRepository.findByEnrollmentId(enrollment.getId());

            AttendanceDTO dto = new AttendanceDTO();
            dto.setCourseCode(enrollment.getCourse().getCode());
            dto.setCourseName(enrollment.getCourse().getName());
            dto.setSemester(enrollment.getSemester());
            dto.setTotalLectures(records.size());

            int present = 0;
            int absent = 0;
            int leaves = 0;

            for (Attendance record : records) {
                switch (record.getPresence()) {
                    case "P" -> present++;
                    case "A" -> absent++;
                    case "L" -> leaves++;
                }
            }

            dto.setPresent(present);
            dto.setAbsent(absent);
            dto.setLeaves(leaves);
            // FAST policy: 2 lates = 1 absent. So each Late counts as half-present.
            // Formula is course-independent — credit-hour weighting cancels out
            // for percentages (the per-session hours appear in numerator and
            // denominator equally, only the L coefficient matters).
            double weightedPresent = present + 0.5 * leaves;
            dto.setPercentage(records.isEmpty() ? 0 : (int) Math.round(weightedPresent * 100.0 / records.size()));

            List<AttendanceDTO.AttendanceRecordDTO> recordDTOs = records.stream().map(r -> {
                AttendanceDTO.AttendanceRecordDTO recordDTO = new AttendanceDTO.AttendanceRecordDTO();
                recordDTO.setLectureNo(r.getLectureNo());
                recordDTO.setDate(r.getDate() != null ? r.getDate().toString() : null);
                recordDTO.setDurationHrs(r.getDurationHrs());
                recordDTO.setPresence(r.getPresence());
                recordDTO.setMethod(r.getMethod());
                return recordDTO;
            }).collect(Collectors.toList());
            dto.setRecords(recordDTOs);

            result.add(dto);
        }

        return result;
    }
}
