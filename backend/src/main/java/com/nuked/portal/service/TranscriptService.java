package com.nuked.portal.service;

import com.nuked.portal.dto.TranscriptDTO;
import com.nuked.portal.model.Enrollment;
import com.nuked.portal.model.Student;
import com.nuked.portal.model.Transcript;
import com.nuked.portal.repository.EnrollmentRepository;
import com.nuked.portal.repository.StudentRepository;
import com.nuked.portal.repository.TranscriptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TranscriptService {

    private final TranscriptRepository transcriptRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;

    public TranscriptDTO getTranscript(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));

        TranscriptDTO transcriptDTO = new TranscriptDTO();
        transcriptDTO.setStudentName(student.getName());
        transcriptDTO.setRollNo(student.getRollNo());
        transcriptDTO.setDegree(student.getDegree());
        transcriptDTO.setCampus(student.getCampus());

        List<Transcript> transcripts = transcriptRepository.findByStudentIdOrderBySemester(studentId);
        List<TranscriptDTO.SemesterTranscriptDTO> semesters = new ArrayList<>();

        for (Transcript transcript : transcripts) {
            TranscriptDTO.SemesterTranscriptDTO semDTO = new TranscriptDTO.SemesterTranscriptDTO();
            semDTO.setSemester(transcript.getSemester());
            semDTO.setCrAttempted(transcript.getCrAttempted());
            semDTO.setCrEarned(transcript.getCrEarned());
            semDTO.setSgpa(transcript.getSgpa());
            semDTO.setCgpa(transcript.getCgpa());

            List<Enrollment> enrollments = enrollmentRepository.findByStudentIdAndSemester(studentId, transcript.getSemester());
            List<TranscriptDTO.CourseGradeDTO> courses = enrollments.stream().map(enrollment -> {
                TranscriptDTO.CourseGradeDTO courseDTO = new TranscriptDTO.CourseGradeDTO();
                courseDTO.setCourseCode(enrollment.getCourse().getCode());
                courseDTO.setCourseName(enrollment.getCourse().getName());
                courseDTO.setCreditHours(enrollment.getCourse().getCreditHours());
                courseDTO.setGrade(enrollment.getGrade());
                courseDTO.setPoints(enrollment.getPoints());
                return courseDTO;
            }).collect(Collectors.toList());
            semDTO.setCourses(courses);

            semesters.add(semDTO);
        }

        transcriptDTO.setSemesters(semesters);
        return transcriptDTO;
    }
}
