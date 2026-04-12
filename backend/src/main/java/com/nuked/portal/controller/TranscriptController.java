package com.nuked.portal.controller;

import com.nuked.portal.dto.TranscriptDTO;
import com.nuked.portal.model.Enrollment;
import com.nuked.portal.model.Student;
import com.nuked.portal.model.Transcript;
import com.nuked.portal.repository.EnrollmentRepository;
import com.nuked.portal.repository.TranscriptRepository;
import com.nuked.portal.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transcript")
@RequiredArgsConstructor
public class TranscriptController {

    private final StudentService studentService;
    private final TranscriptRepository transcriptRepository;
    private final EnrollmentRepository enrollmentRepository;

    @GetMapping
    public ResponseEntity<TranscriptDTO> getTranscript(Authentication auth) {
        Student student = studentService.findByRollNo(auth.getName());

        List<Transcript> transcripts = transcriptRepository.findByStudentIdOrderBySemester(student.getId());
        List<Enrollment> allEnrollments = enrollmentRepository.findByStudentId(student.getId());

        Map<String, List<Enrollment>> enrollmentsBySemester = allEnrollments.stream()
                .collect(Collectors.groupingBy(Enrollment::getSemester));

        TranscriptDTO dto = new TranscriptDTO();
        dto.setStudentName(student.getName());
        dto.setRollNo(student.getRollNo());
        dto.setDegree(student.getDegree());
        dto.setCampus(student.getCampus());

        List<TranscriptDTO.SemesterTranscriptDTO> semesters = new ArrayList<>();
        for (Transcript t : transcripts) {
            TranscriptDTO.SemesterTranscriptDTO semDTO = new TranscriptDTO.SemesterTranscriptDTO();
            semDTO.setSemester(t.getSemester());
            semDTO.setCrAttempted(t.getCrAttempted());
            semDTO.setCrEarned(t.getCrEarned());
            semDTO.setSgpa(t.getSgpa());
            semDTO.setCgpa(t.getCgpa());

            List<Enrollment> semEnrollments = enrollmentsBySemester.getOrDefault(t.getSemester(), List.of());
            List<TranscriptDTO.CourseGradeDTO> courses = semEnrollments.stream().map(e -> {
                TranscriptDTO.CourseGradeDTO courseDTO = new TranscriptDTO.CourseGradeDTO();
                courseDTO.setCourseCode(e.getCourse().getCode());
                courseDTO.setCourseName(e.getCourse().getName());
                courseDTO.setCreditHours(e.getCourse().getCreditHours());
                courseDTO.setGrade(e.getGrade());
                courseDTO.setPoints(e.getPoints());
                return courseDTO;
            }).collect(Collectors.toList());
            semDTO.setCourses(courses);

            semesters.add(semDTO);
        }
        dto.setSemesters(semesters);

        return ResponseEntity.ok(dto);
    }
}
