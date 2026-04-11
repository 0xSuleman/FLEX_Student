package com.flex.student;

import com.flex.student.model.*;
import com.flex.student.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final MarksRepository marksRepository;
    private final TranscriptRepository transcriptRepository;
    private final FeeChallanRepository feeChallanRepository;
    private final FeeDetailRepository feeDetailRepository;
    private final FamilyInfoRepository familyInfoRepository;
    private final ContactInfoRepository contactInfoRepository;
    private final AcademicCalendarRepository academicCalendarRepository;
    private final StudyPlanCourseRepository studyPlanCourseRepository;
    private final CourseFeedbackRepository courseFeedbackRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(StudentRepository studentRepository,
                           CourseRepository courseRepository,
                           EnrollmentRepository enrollmentRepository,
                           AttendanceRepository attendanceRepository,
                           MarksRepository marksRepository,
                           TranscriptRepository transcriptRepository,
                           FeeChallanRepository feeChallanRepository,
                           FeeDetailRepository feeDetailRepository,
                           FamilyInfoRepository familyInfoRepository,
                           ContactInfoRepository contactInfoRepository,
                           AcademicCalendarRepository academicCalendarRepository,
                           StudyPlanCourseRepository studyPlanCourseRepository,
                           CourseFeedbackRepository courseFeedbackRepository,
                           PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.marksRepository = marksRepository;
        this.transcriptRepository = transcriptRepository;
        this.feeChallanRepository = feeChallanRepository;
        this.feeDetailRepository = feeDetailRepository;
        this.familyInfoRepository = familyInfoRepository;
        this.contactInfoRepository = contactInfoRepository;
        this.academicCalendarRepository = academicCalendarRepository;
        this.studyPlanCourseRepository = studyPlanCourseRepository;
        this.courseFeedbackRepository = courseFeedbackRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (studentRepository.findByRollNo("24L-3072").isPresent()) {
            return; // Data already seeded
        }

        // ====== STUDENT ======
        Student student = new Student();
        student.setRollNo("24L-3072");
        student.setPassword(passwordEncoder.encode("password123"));
        student.setName("Suleman Ahmed");
        student.setGender("Male");
        student.setEmail("l243072@lhr.nu.edu.pk");
        student.setDob(LocalDate.of(2005, 8, 15));
        student.setCnic("35202-1234567-1");
        student.setMobileNo("+92-321-1234567");
        student.setBloodGroup("B+");
        student.setNationality("Pakistani");
        student.setDegree("BS(SE)");
        student.setBatch("Fall 2024");
        student.setSection("BSE-243A");
        student.setCampus("Lahore");
        student.setStatus("Active");
        student.setProfileImageUrl(null);
        student = studentRepository.save(student);

        // ====== FAMILY INFO ======
        FamilyInfo father = new FamilyInfo();
        father.setStudent(student);
        father.setRelation("Father");
        father.setName("Ahmed Ali");
        father.setCnic("35202-9876543-1");
        father.setTaxWithholding("Filer");
        familyInfoRepository.save(father);

        FamilyInfo mother = new FamilyInfo();
        mother.setStudent(student);
        mother.setRelation("Mother");
        mother.setName("Fatima Ahmed");
        mother.setCnic("35202-9876544-2");
        mother.setTaxWithholding("Non-Filer");
        familyInfoRepository.save(mother);

        // ====== CONTACT INFO ======
        ContactInfo contact = new ContactInfo();
        contact.setStudent(student);
        contact.setAddress("House 45, Street 12, Gulberg III");
        contact.setCity("Lahore");
        contact.setPostalCode("54660");
        contact.setPhone("+92-42-35761234");
        contact.setEmergencyContact("+92-300-9876543");
        contactInfoRepository.save(contact);

        // ====== ACADEMIC CALENDAR ======
        createCalendarEvent("Spring 2025 Classes Begin", LocalDate.of(2025, 2, 3), LocalDate.of(2025, 2, 3));
        createCalendarEvent("Last Date to Add/Drop Courses", LocalDate.of(2025, 2, 14), LocalDate.of(2025, 2, 14));
        createCalendarEvent("Kashmir Day (Holiday)", LocalDate.of(2025, 2, 5), LocalDate.of(2025, 2, 5));
        createCalendarEvent("Midterm Examinations", LocalDate.of(2025, 3, 17), LocalDate.of(2025, 3, 28));
        createCalendarEvent("Pakistan Day (Holiday)", LocalDate.of(2025, 3, 23), LocalDate.of(2025, 3, 23));
        createCalendarEvent("Course Feedback Period", LocalDate.of(2025, 5, 5), LocalDate.of(2025, 5, 16));
        createCalendarEvent("Final Examinations", LocalDate.of(2025, 5, 19), LocalDate.of(2025, 6, 6));
        createCalendarEvent("Semester Result Declaration", LocalDate.of(2025, 6, 20), LocalDate.of(2025, 6, 20));
        createCalendarEvent("Summer Break", LocalDate.of(2025, 6, 9), LocalDate.of(2025, 8, 29));
        createCalendarEvent("Fall 2025 Registration", LocalDate.of(2025, 8, 18), LocalDate.of(2025, 8, 22));

        // ====== COURSES ======
        // Semester 1 courses
        Course cs101 = createCourse("CS1001", "Introduction to Computing", 3, Course.CourseType.CORE, "Semester 1");
        Course cs102 = createCourse("CS1002", "Programming Fundamentals", 3, Course.CourseType.CORE, "Semester 1");
        Course mt101 = createCourse("MT1001", "Calculus and Analytical Geometry", 3, Course.CourseType.CORE, "Semester 1");
        Course ee101 = createCourse("EE1001", "Applied Physics", 3, Course.CourseType.CORE, "Semester 1");
        Course hu101 = createCourse("HU1001", "English Composition and Comprehension", 3, Course.CourseType.CORE, "Semester 1");
        Course cs103 = createCourse("CS1003", "ICT Lab", 1, Course.CourseType.CORE, "Semester 1");
        Course cs104 = createCourse("CS1004", "Programming Fundamentals Lab", 1, Course.CourseType.CORE, "Semester 1");

        // Semester 2 courses
        Course cs201 = createCourse("CS2001", "Object Oriented Programming", 3, Course.CourseType.CORE, "Semester 2");
        Course cs202 = createCourse("CS2002", "Data Structures", 3, Course.CourseType.CORE, "Semester 2");
        Course mt201 = createCourse("MT2001", "Linear Algebra", 3, Course.CourseType.CORE, "Semester 2");
        Course cs203 = createCourse("CS2003", "Discrete Structures", 3, Course.CourseType.CORE, "Semester 2");
        Course hu201 = createCourse("HU2001", "Islamic Studies / Ethics", 2, Course.CourseType.CORE, "Semester 2");
        Course cs204 = createCourse("CS2004", "OOP Lab", 1, Course.CourseType.CORE, "Semester 2");
        Course cs205 = createCourse("CS2005", "Data Structures Lab", 1, Course.CourseType.CORE, "Semester 2");

        // Future semester courses for study plan
        Course cs301 = createCourse("CS3001", "Design and Analysis of Algorithms", 3, Course.CourseType.CORE, "Semester 3");
        Course cs302 = createCourse("CS3002", "Database Systems", 3, Course.CourseType.CORE, "Semester 3");
        Course cs303 = createCourse("CS3003", "Computer Organization and Assembly Language", 3, Course.CourseType.CORE, "Semester 3");
        Course mt301 = createCourse("MT3001", "Probability and Statistics", 3, Course.CourseType.CORE, "Semester 3");
        Course hu301 = createCourse("HU3001", "Pakistan Studies", 2, Course.CourseType.CORE, "Semester 3");
        Course cs304 = createCourse("CS3004", "Database Systems Lab", 1, Course.CourseType.CORE, "Semester 3");

        Course se401 = createCourse("SE4001", "Software Engineering", 3, Course.CourseType.CORE, "Semester 4");
        Course cs401 = createCourse("CS4001", "Operating Systems", 3, Course.CourseType.CORE, "Semester 4");
        Course cs402 = createCourse("CS4002", "Computer Networks", 3, Course.CourseType.CORE, "Semester 4");
        Course mt401 = createCourse("MT4001", "Differential Equations", 3, Course.CourseType.CORE, "Semester 4");
        Course hu401 = createCourse("HU4001", "Technical and Business Writing", 2, Course.CourseType.CORE, "Semester 4");

        Course se501 = createCourse("SE5001", "Software Design and Architecture", 3, Course.CourseType.CORE, "Semester 5");
        Course se502 = createCourse("SE5002", "Software Requirements Engineering", 3, Course.CourseType.CORE, "Semester 5");
        Course cs501 = createCourse("CS5001", "Artificial Intelligence", 3, Course.CourseType.CORE, "Semester 5");
        Course se503 = createCourse("SE5003", "Software Quality Engineering", 3, Course.CourseType.CORE, "Semester 5");
        Course el501 = createCourse("EL5001", "Elective I", 3, Course.CourseType.ELECTIVE, "Semester 5");

        Course se601 = createCourse("SE6001", "Software Project Management", 3, Course.CourseType.CORE, "Semester 6");
        Course se602 = createCourse("SE6002", "Software Construction", 3, Course.CourseType.CORE, "Semester 6");
        Course cs601 = createCourse("CS6001", "Information Security", 3, Course.CourseType.CORE, "Semester 6");
        Course el601 = createCourse("EL6001", "Elective II", 3, Course.CourseType.ELECTIVE, "Semester 6");
        Course el602 = createCourse("EL6002", "Elective III", 3, Course.CourseType.ELECTIVE, "Semester 6");

        Course se701 = createCourse("SE7001", "Final Year Project I", 3, Course.CourseType.CORE, "Semester 7");
        Course el701 = createCourse("EL7001", "Elective IV", 3, Course.CourseType.ELECTIVE, "Semester 7");
        Course el702 = createCourse("EL7002", "Elective V", 3, Course.CourseType.ELECTIVE, "Semester 7");
        Course hu701 = createCourse("HU7001", "Professional Practices", 2, Course.CourseType.CORE, "Semester 7");

        Course se801 = createCourse("SE8001", "Final Year Project II", 3, Course.CourseType.CORE, "Semester 8");
        Course el801 = createCourse("EL8001", "Elective VI", 3, Course.CourseType.ELECTIVE, "Semester 8");
        Course hu801 = createCourse("HU8001", "Entrepreneurship", 2, Course.CourseType.CORE, "Semester 8");

        // ====== SEMESTER 1 ENROLLMENTS ======
        Enrollment e1 = createEnrollment(student, cs101, "Fall 2024", "BSE-243A", "A-", 3.67);
        Enrollment e2 = createEnrollment(student, cs102, "Fall 2024", "BSE-243A", "A", 4.00);
        Enrollment e3 = createEnrollment(student, mt101, "Fall 2024", "BSE-243A", "B+", 3.33);
        Enrollment e4 = createEnrollment(student, ee101, "Fall 2024", "BSE-243A", "B", 3.00);
        Enrollment e5 = createEnrollment(student, hu101, "Fall 2024", "BSE-243A", "A", 4.00);
        Enrollment e6 = createEnrollment(student, cs103, "Fall 2024", "BSE-243A", "A", 4.00);
        Enrollment e7 = createEnrollment(student, cs104, "Fall 2024", "BSE-243A", "A", 4.00);

        // ====== SEMESTER 2 ENROLLMENTS ======
        Enrollment e8 = createEnrollment(student, cs201, "Spring 2025", "BSE-243A", null, null);
        Enrollment e9 = createEnrollment(student, cs202, "Spring 2025", "BSE-243A", null, null);
        Enrollment e10 = createEnrollment(student, mt201, "Spring 2025", "BSE-243A", null, null);
        Enrollment e11 = createEnrollment(student, cs203, "Spring 2025", "BSE-243A", null, null);
        Enrollment e12 = createEnrollment(student, hu201, "Spring 2025", "BSE-243A", null, null);
        Enrollment e13 = createEnrollment(student, cs204, "Spring 2025", "BSE-243A", null, null);
        Enrollment e14 = createEnrollment(student, cs205, "Spring 2025", "BSE-243A", null, null);

        // ====== ATTENDANCE - SEMESTER 1 ======
        generateAttendance(e1, 30, LocalDate.of(2024, 9, 2));
        generateAttendance(e2, 32, LocalDate.of(2024, 9, 2));
        generateAttendance(e3, 28, LocalDate.of(2024, 9, 2));
        generateAttendance(e4, 30, LocalDate.of(2024, 9, 2));
        generateAttendance(e5, 26, LocalDate.of(2024, 9, 2));
        generateAttendance(e6, 14, LocalDate.of(2024, 9, 2));
        generateAttendance(e7, 15, LocalDate.of(2024, 9, 2));

        // ====== ATTENDANCE - SEMESTER 2 (in progress) ======
        generateAttendance(e8, 15, LocalDate.of(2025, 2, 3));
        generateAttendance(e9, 16, LocalDate.of(2025, 2, 3));
        generateAttendance(e10, 14, LocalDate.of(2025, 2, 3));
        generateAttendance(e11, 15, LocalDate.of(2025, 2, 3));
        generateAttendance(e12, 12, LocalDate.of(2025, 2, 3));
        generateAttendance(e13, 7, LocalDate.of(2025, 2, 3));
        generateAttendance(e14, 8, LocalDate.of(2025, 2, 3));

        // ====== MARKS - SEMESTER 1 ======
        generateMarksForCourse(e1, true);
        generateMarksForCourse(e2, true);
        generateMarksForCourse(e3, true);
        generateMarksForCourse(e4, true);
        generateMarksForCourse(e5, true);
        generateLabMarks(e6, true);
        generateLabMarks(e7, true);

        // ====== MARKS - SEMESTER 2 (partial) ======
        generatePartialMarks(e8);
        generatePartialMarks(e9);
        generatePartialMarks(e10);
        generatePartialMarks(e11);
        generatePartialMarks(e12);

        // ====== TRANSCRIPT ======
        Transcript t1 = new Transcript();
        t1.setStudent(student);
        t1.setSemester("Fall 2024");
        t1.setCrAttempted(17);
        t1.setCrEarned(17);
        t1.setSgpa(3.68);
        t1.setCgpa(3.68);
        transcriptRepository.save(t1);

        // ====== FEE CHALLANS ======
        FeeChallan challan1 = new FeeChallan();
        challan1.setStudent(student);
        challan1.setSemester("Fall 2024");
        challan1.setChallanNo("CH-2024F-003072");
        challan1.setAmount(215000.0);
        challan1.setDueDate(LocalDate.of(2024, 8, 25));
        challan1.setStatus(FeeChallan.ChallanStatus.PAID);
        challan1.setGeneratedDate(LocalDate.of(2024, 8, 1));
        challan1.setPaidDate(LocalDate.of(2024, 8, 20));
        challan1 = feeChallanRepository.save(challan1);

        createFeeDetail(challan1, "Tuition Fee", 0.0, 180000.0, 0.0, 0.0, 180000.0, 0.0, "CHQ-78451", "Online");
        createFeeDetail(challan1, "Registration Fee", 0.0, 5000.0, 0.0, 0.0, 5000.0, 0.0, "CHQ-78451", "Online");
        createFeeDetail(challan1, "Lab Charges", 0.0, 10000.0, 0.0, 0.0, 10000.0, 0.0, "CHQ-78451", "Online");
        createFeeDetail(challan1, "Library Fee", 0.0, 5000.0, 0.0, 0.0, 5000.0, 0.0, "CHQ-78451", "Online");
        createFeeDetail(challan1, "Student Activity Fund", 0.0, 5000.0, 0.0, 0.0, 5000.0, 0.0, "CHQ-78451", "Online");
        createFeeDetail(challan1, "Security Deposit (Refundable)", 0.0, 10000.0, 0.0, 0.0, 10000.0, 0.0, "CHQ-78451", "Online");

        FeeChallan challan2 = new FeeChallan();
        challan2.setStudent(student);
        challan2.setSemester("Spring 2025");
        challan2.setChallanNo("CH-2025S-003072");
        challan2.setAmount(210000.0);
        challan2.setDueDate(LocalDate.of(2025, 1, 25));
        challan2.setStatus(FeeChallan.ChallanStatus.PAID);
        challan2.setGeneratedDate(LocalDate.of(2025, 1, 5));
        challan2.setPaidDate(LocalDate.of(2025, 1, 22));
        challan2 = feeChallanRepository.save(challan2);

        createFeeDetail(challan2, "Tuition Fee", 0.0, 180000.0, 0.0, 0.0, 180000.0, 0.0, "CHQ-91023", "Online");
        createFeeDetail(challan2, "Registration Fee", 0.0, 5000.0, 0.0, 0.0, 5000.0, 0.0, "CHQ-91023", "Online");
        createFeeDetail(challan2, "Lab Charges", 0.0, 10000.0, 0.0, 0.0, 10000.0, 0.0, "CHQ-91023", "Online");
        createFeeDetail(challan2, "Library Fee", 0.0, 5000.0, 0.0, 0.0, 5000.0, 0.0, "CHQ-91023", "Online");
        createFeeDetail(challan2, "Student Activity Fund", 0.0, 5000.0, 0.0, 0.0, 5000.0, 0.0, "CHQ-91023", "Online");
        createFeeDetail(challan2, "Examination Fee", 0.0, 5000.0, 0.0, 0.0, 5000.0, 0.0, "CHQ-91023", "Online");

        // ====== COURSE FEEDBACK ======
        for (Enrollment e : List.of(e1, e2, e3, e4, e5, e6, e7)) {
            CourseFeedback fb = new CourseFeedback();
            fb.setEnrollment(e);
            fb.setStatus(CourseFeedback.FeedbackStatus.SUBMITTED);
            fb.setSubmittedDate(LocalDate.of(2024, 12, 10));
            fb.setRating(4);
            fb.setComments("Good course overall. Instructor was helpful.");
            courseFeedbackRepository.save(fb);
        }
        for (Enrollment e : List.of(e8, e9, e10, e11, e12, e13, e14)) {
            CourseFeedback fb = new CourseFeedback();
            fb.setEnrollment(e);
            fb.setStatus(CourseFeedback.FeedbackStatus.PENDING);
            courseFeedbackRepository.save(fb);
        }

        // ====== STUDY PLAN ======
        // Semester 1
        for (Course c : List.of(cs101, cs102, mt101, ee101, hu101, cs103, cs104)) {
            createStudyPlan(student, c, "Semester 1");
        }
        // Semester 2
        for (Course c : List.of(cs201, cs202, mt201, cs203, hu201, cs204, cs205)) {
            createStudyPlan(student, c, "Semester 2");
        }
        // Semester 3
        for (Course c : List.of(cs301, cs302, cs303, mt301, hu301, cs304)) {
            createStudyPlan(student, c, "Semester 3");
        }
        // Semester 4
        for (Course c : List.of(se401, cs401, cs402, mt401, hu401)) {
            createStudyPlan(student, c, "Semester 4");
        }
        // Semester 5
        for (Course c : List.of(se501, se502, cs501, se503, el501)) {
            createStudyPlan(student, c, "Semester 5");
        }
        // Semester 6
        for (Course c : List.of(se601, se602, cs601, el601, el602)) {
            createStudyPlan(student, c, "Semester 6");
        }
        // Semester 7
        for (Course c : List.of(se701, el701, el702, hu701)) {
            createStudyPlan(student, c, "Semester 7");
        }
        // Semester 8
        for (Course c : List.of(se801, el801, hu801)) {
            createStudyPlan(student, c, "Semester 8");
        }

        System.out.println("========================================");
        System.out.println("  FLEX Student Portal - Data Seeded!");
        System.out.println("  Login: 24L-3072 / password123");
        System.out.println("========================================");
    }

    private void createCalendarEvent(String name, LocalDate start, LocalDate end) {
        AcademicCalendar event = new AcademicCalendar();
        event.setEventName(name);
        event.setStartDate(start);
        event.setEndDate(end);
        academicCalendarRepository.save(event);
    }

    private Course createCourse(String code, String name, int credits, Course.CourseType type, String semester) {
        Course course = new Course();
        course.setCode(code);
        course.setName(name);
        course.setCreditHours(credits);
        course.setType(type);
        course.setSemester(semester);
        return courseRepository.save(course);
    }

    private Enrollment createEnrollment(Student student, Course course, String semester, String section, String grade, Double points) {
        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setSemester(semester);
        enrollment.setSection(section);
        enrollment.setGrade(grade);
        enrollment.setPoints(points);
        enrollment.setStatus("ENROLLED");
        enrollment.setRemarks(grade != null ? "Completed" : "In Progress");
        return enrollmentRepository.save(enrollment);
    }

    private void generateAttendance(Enrollment enrollment, int totalLectures, LocalDate startDate) {
        Random random = new Random(enrollment.getId() != null ? enrollment.getId() : 1);
        LocalDate currentDate = startDate;

        for (int i = 1; i <= totalLectures; i++) {
            Attendance attendance = new Attendance();
            attendance.setEnrollment(enrollment);
            attendance.setLectureNo(i);
            attendance.setDate(currentDate);
            attendance.setDurationHrs(enrollment.getCourse().getCreditHours() <= 1 ? 3.0 : 1.5);

            int rand = random.nextInt(100);
            if (rand < 85) {
                attendance.setPresence("P");
            } else if (rand < 95) {
                attendance.setPresence("A");
            } else {
                attendance.setPresence("L");
            }

            attendanceRepository.save(attendance);

            // Move to next lecture day (skip weekends)
            currentDate = currentDate.plusDays(random.nextInt(2) + 2);
            while (currentDate.getDayOfWeek().getValue() > 5) {
                currentDate = currentDate.plusDays(1);
            }
        }
    }

    private void generateMarksForCourse(Enrollment enrollment, boolean completed) {
        // Quiz 1
        createMark(enrollment, Marks.EvaluationType.QUIZ, "Quiz 1", 5.0, 8.5, 10.0, 7.2, 1.8, 3.0, 10.0);
        // Quiz 2
        createMark(enrollment, Marks.EvaluationType.QUIZ, "Quiz 2", 5.0, 9.0, 10.0, 6.8, 2.1, 2.5, 10.0);
        // Quiz 3
        createMark(enrollment, Marks.EvaluationType.QUIZ, "Quiz 3", 5.0, 7.5, 10.0, 6.5, 1.9, 2.0, 9.5);
        // Assignment 1
        createMark(enrollment, Marks.EvaluationType.ASSIGNMENT, "Assignment 1", 5.0, 18.0, 20.0, 15.5, 3.2, 8.0, 20.0);
        // Assignment 2
        createMark(enrollment, Marks.EvaluationType.ASSIGNMENT, "Assignment 2", 5.0, 17.0, 20.0, 14.8, 3.5, 7.0, 20.0);
        // Sessional 1
        createMark(enrollment, Marks.EvaluationType.SESSIONAL, "Sessional 1", 10.0, 22.0, 30.0, 19.5, 4.2, 8.0, 28.0);
        // Midterm
        createMark(enrollment, Marks.EvaluationType.MIDTERM, "Midterm Exam", 25.0, 38.0, 50.0, 32.5, 7.8, 12.0, 47.0);

        if (completed) {
            // Sessional 2
            createMark(enrollment, Marks.EvaluationType.SESSIONAL, "Sessional 2", 10.0, 25.0, 30.0, 20.2, 4.5, 9.0, 29.0);
            // Final
            createMark(enrollment, Marks.EvaluationType.FINAL, "Final Exam", 30.0, 42.0, 50.0, 34.0, 8.5, 10.0, 48.0);
        }
    }

    private void generateLabMarks(Enrollment enrollment, boolean completed) {
        createMark(enrollment, Marks.EvaluationType.ASSIGNMENT, "Lab Task 1", 10.0, 9.0, 10.0, 8.2, 1.2, 5.0, 10.0);
        createMark(enrollment, Marks.EvaluationType.ASSIGNMENT, "Lab Task 2", 10.0, 8.5, 10.0, 7.8, 1.5, 4.0, 10.0);
        createMark(enrollment, Marks.EvaluationType.ASSIGNMENT, "Lab Task 3", 10.0, 9.5, 10.0, 8.0, 1.3, 5.0, 10.0);
        createMark(enrollment, Marks.EvaluationType.MIDTERM, "Lab Midterm", 30.0, 26.0, 30.0, 22.5, 4.0, 10.0, 30.0);

        if (completed) {
            createMark(enrollment, Marks.EvaluationType.FINAL, "Lab Final", 40.0, 36.0, 40.0, 30.5, 5.2, 12.0, 40.0);
        }
    }

    private void generatePartialMarks(Enrollment enrollment) {
        createMark(enrollment, Marks.EvaluationType.QUIZ, "Quiz 1", 5.0, 7.0, 10.0, 6.2, 2.0, 2.0, 9.5);
        createMark(enrollment, Marks.EvaluationType.QUIZ, "Quiz 2", 5.0, 8.0, 10.0, 6.5, 1.8, 3.0, 10.0);
        createMark(enrollment, Marks.EvaluationType.ASSIGNMENT, "Assignment 1", 5.0, 16.0, 20.0, 14.0, 3.0, 6.0, 19.0);
    }

    private void createMark(Enrollment enrollment, Marks.EvaluationType type, String name,
                             Double weightage, Double obtained, Double total,
                             Double average, Double stdDev, Double min, Double max) {
        Marks mark = new Marks();
        mark.setEnrollment(enrollment);
        mark.setEvaluationType(type);
        mark.setEvaluationName(name);
        mark.setWeightage(weightage);
        mark.setObtained(obtained);
        mark.setTotal(total);
        mark.setAverage(average);
        mark.setStdDev(stdDev);
        mark.setMin(min);
        mark.setMax(max);
        marksRepository.save(mark);
    }

    private void createFeeDetail(FeeChallan challan, String description, Double arrears, Double due,
                                  Double discount, Double sponsored, Double collection, Double balance,
                                  String instrumentNo, String instrumentType) {
        FeeDetail detail = new FeeDetail();
        detail.setFeeChallan(challan);
        detail.setDescription(description);
        detail.setArrears(arrears);
        detail.setDue(due);
        detail.setDiscount(discount);
        detail.setSponsored(sponsored);
        detail.setCollection(collection);
        detail.setBalance(balance);
        detail.setInstrumentNo(instrumentNo);
        detail.setInstrumentType(instrumentType);
        feeDetailRepository.save(detail);
    }

    private void createStudyPlan(Student student, Course course, String semester) {
        StudyPlanCourse spc = new StudyPlanCourse();
        spc.setStudent(student);
        spc.setCourse(course);
        spc.setPlannedSemester(semester);
        studyPlanCourseRepository.save(spc);
    }
}
