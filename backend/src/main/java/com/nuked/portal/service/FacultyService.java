package com.nuked.portal.service;

import com.nuked.portal.dto.FacultySectionDTO;
import com.nuked.portal.dto.RosterEntryDTO;
import com.nuked.portal.model.Enrollment;
import com.nuked.portal.model.Faculty;
import com.nuked.portal.model.FacultySection;
import com.nuked.portal.repository.EnrollmentRepository;
import com.nuked.portal.repository.FacultyRepository;
import com.nuked.portal.repository.FacultySectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacultyService {

    private final FacultyRepository facultyRepository;
    private final FacultySectionRepository facultySectionRepository;
    private final EnrollmentRepository enrollmentRepository;

    public Faculty currentFaculty(String username) {
        return facultyRepository.findByUsername(username)
                .orElseThrow(() -> new AccessDeniedException("Unknown faculty: " + username));
    }

    public List<FacultySectionDTO> assignedSections(String username, String semester) {
        Faculty fac = currentFaculty(username);
        List<FacultySection> rows = (semester == null || semester.isBlank())
                ? facultySectionRepository.findByFacultyId(fac.getId())
                : facultySectionRepository.findByFacultyIdAndSemester(fac.getId(), semester);
        return rows.stream().map(this::toDto).toList();
    }

    public List<RosterEntryDTO> roster(String username, Long facultySectionId) {
        Faculty fac = currentFaculty(username);
        FacultySection fs = facultySectionRepository.findByIdAndFacultyId(facultySectionId, fac.getId())
                .orElseThrow(() -> new AccessDeniedException("Section not assigned to you"));
        List<Enrollment> enrolled = enrollmentRepository.findByCourseIdAndSectionAndSemester(
                fs.getCourse().getId(), fs.getSection(), fs.getSemester());
        return enrolled.stream()
                .filter(e -> e.getStudent() != null)
                .map(e -> new RosterEntryDTO(
                        e.getId(),
                        e.getStudent().getRollNo(),
                        e.getStudent().getName(),
                        e.getStudent().getDegree()))
                .toList();
    }

    public FacultySection ownedSection(String username, Long facultySectionId) {
        Faculty fac = currentFaculty(username);
        return facultySectionRepository.findByIdAndFacultyId(facultySectionId, fac.getId())
                .orElseThrow(() -> new AccessDeniedException("Section not assigned to you"));
    }

    private FacultySectionDTO toDto(FacultySection fs) {
        int enrolled = enrollmentRepository
                .findByCourseIdAndSectionAndSemester(fs.getCourse().getId(), fs.getSection(), fs.getSemester())
                .size();
        return new FacultySectionDTO(
                fs.getId(),
                fs.getCourse().getCode(),
                fs.getCourse().getName(),
                fs.getCourse().getCreditHours(),
                fs.getSection(),
                fs.getSemester(),
                fs.getRoom(),
                fs.getDayPattern(),
                fs.getTimeSlot(),
                enrolled);
    }
}
