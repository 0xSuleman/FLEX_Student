package com.nuked.portal;

import com.nuked.portal.model.Course;
import com.nuked.portal.model.Faculty;
import com.nuked.portal.model.FacultySection;
import com.nuked.portal.repository.CourseRepository;
import com.nuked.portal.repository.FacultyRepository;
import com.nuked.portal.repository.FacultySectionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds Faculty + their section assignments AFTER the main student/course seed has run.
 * Idempotent: short-circuits when at least one faculty already exists.
 */
@Component
@Order(2)
public class FacultyDataInitializer implements CommandLineRunner {

    private final FacultyRepository facultyRepository;
    private final FacultySectionRepository facultySectionRepository;
    private final CourseRepository courseRepository;
    private final PasswordEncoder passwordEncoder;

    public FacultyDataInitializer(FacultyRepository facultyRepository,
                                  FacultySectionRepository facultySectionRepository,
                                  CourseRepository courseRepository,
                                  PasswordEncoder passwordEncoder) {
        this.facultyRepository = facultyRepository;
        this.facultySectionRepository = facultySectionRepository;
        this.courseRepository = courseRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (facultyRepository.count() > 0) return;

        Faculty zeeshan = new Faculty();
        zeeshan.setUsername("zeeshan.rana");
        zeeshan.setPassword(passwordEncoder.encode("password123"));
        zeeshan.setName("Zeeshan Ali Rana");
        zeeshan.setDesignation("Senior Lecturer");
        zeeshan.setDepartment("Computer Science");
        zeeshan.setEmployeeId("EMP-LHR-104");
        zeeshan.setEmail("zeeshan.rana@nu.edu.pk");
        zeeshan.setCampus("Lahore");
        facultyRepository.save(zeeshan);

        Faculty hammad = new Faculty();
        hammad.setUsername("hammad.afzal");
        hammad.setPassword(passwordEncoder.encode("password123"));
        hammad.setName("Hammad Afzal");
        hammad.setDesignation("Lecturer");
        hammad.setDepartment("Computer Science");
        hammad.setEmployeeId("EMP-LHR-118");
        hammad.setEmail("hammad.afzal@nu.edu.pk");
        hammad.setCampus("Lahore");
        facultyRepository.save(hammad);

        // Assign Zeeshan to CS3001 (SE) sections A & B and CS3002 section A
        assign(zeeshan, "CS3001", "BSE-243A", "Spring 2026", "C-204", "Mon/Wed", "10:00-11:30");
        assign(zeeshan, "CS3001", "BSE-243B", "Spring 2026", "C-204", "Mon/Wed", "11:30-13:00");
        assign(zeeshan, "CS3002", "BSE-243A", "Spring 2026", "D-301", "Tue/Thu", "10:00-11:30");

        // Assign Hammad to CS3003 (OS) sections A & B
        assign(hammad, "CS3003", "BSE-243A", "Spring 2026", "C-110", "Mon/Wed", "13:00-14:30");
        assign(hammad, "CS3003", "BSE-243B", "Spring 2026", "C-110", "Mon/Wed", "14:30-16:00");
    }

    private void assign(Faculty f, String courseCode, String section, String semester,
                        String room, String dayPattern, String timeSlot) {
        Course course = courseRepository.findAll().stream()
                .filter(c -> courseCode.equals(c.getCode()) && semester.equals(c.getSemester()))
                .findFirst()
                .orElse(null);
        if (course == null) return; // course wasn't seeded — skip silently
        FacultySection fs = new FacultySection();
        fs.setFaculty(f);
        fs.setCourse(course);
        fs.setSection(section);
        fs.setSemester(semester);
        fs.setRoom(room);
        fs.setDayPattern(dayPattern);
        fs.setTimeSlot(timeSlot);
        facultySectionRepository.save(fs);
    }
}
