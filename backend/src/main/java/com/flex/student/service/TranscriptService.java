package com.flex.student.service;

import com.flex.student.dto.TranscriptDTO;
import com.flex.student.model.Enrollment;
import com.flex.student.model.Student;
import com.flex.student.model.Transcript;
import com.flex.student.repository.EnrollmentRepository;
import com.flex.student.repository.StudentRepository;
import com.flex.student.repository.TranscriptRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TranscriptService {

    private final TranscriptRepository transcriptRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;

    public TranscriptService(TranscriptRepository transcriptRepository,
                             EnrollmentRepository enrollmentRepository,
                             StudentRepository studentRepository) {
        this.transcriptRepository = transcriptRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.studentRepository = studentRepository;
    }

    public TranscriptDTO getTranscript(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        TranscriptDTO dto = new TranscriptDTO();
        dto.setStudentName(student.getName());
        dto.setRollNo(student.getRollNo());
        dto.setDegree(student.getDegree());
        dto.setCampus(student.getCampus());

        List<Transcript> transcripts = transcriptRepository.findByStudentIdOrderBySemester(studentId);
        List<TranscriptDTO.SemesterTranscriptDTO> semesterDTOs = new ArrayList<>();

        for (Transcript transcript : transcripts) {
            TranscriptDTO.SemesterTranscriptDTO semDTO = new TranscriptDTO.SemesterTranscriptDTO();
            semDTO.setSemester(transcript.getSemester());
            semDTO.setCrAttempted(transcript.getCrAttempted());
            semDTO.setCrEarned(transcript.getCrEarned());
            semDTO.setSgpa(transcript.getSgpa());
            semDTO.setCgpa(transcript.getCgpa());

            List<Enrollment> enrollments = enrollmentRepository.findByStudentIdAndSemester(studentId, transcript.getSemester());
            List<TranscriptDTO.CourseGradeDTO> courseGrades = enrollments.stream().map(e -> {
                TranscriptDTO.CourseGradeDTO cg = new TranscriptDTO.CourseGradeDTO();
                cg.setCourseCode(e.getCourse().getCode());
                cg.setCourseName(e.getCourse().getName());
                cg.setCreditHours(e.getCourse().getCreditHours());
                cg.setGrade(e.getGrade());
                cg.setPoints(e.getPoints());
                return cg;
            }).collect(Collectors.toList());
            semDTO.setCourses(courseGrades);

            semesterDTOs.add(semDTO);
        }

        dto.setSemesters(semesterDTOs);
        return dto;
    }
}
