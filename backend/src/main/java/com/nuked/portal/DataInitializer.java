package com.nuked.portal;

import com.nuked.portal.model.*;
import com.nuked.portal.repository.*;

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
    private final CourseFeedbackRepository courseFeedbackRepository;
    private final AcademicCalendarRepository academicCalendarRepository;
    private final ContactInfoRepository contactInfoRepository;
    private final FamilyInfoRepository familyInfoRepository;
    private final StudyPlanCourseRepository studyPlanCourseRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(StudentRepository studentRepository,
                           CourseRepository courseRepository,
                           EnrollmentRepository enrollmentRepository,
                           AttendanceRepository attendanceRepository,
                           MarksRepository marksRepository,
                           TranscriptRepository transcriptRepository,
                           FeeChallanRepository feeChallanRepository,
                           FeeDetailRepository feeDetailRepository,
                           CourseFeedbackRepository courseFeedbackRepository,
                           AcademicCalendarRepository academicCalendarRepository,
                           ContactInfoRepository contactInfoRepository,
                           FamilyInfoRepository familyInfoRepository,
                           StudyPlanCourseRepository studyPlanCourseRepository,
                           PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.marksRepository = marksRepository;
        this.transcriptRepository = transcriptRepository;
        this.feeChallanRepository = feeChallanRepository;
        this.feeDetailRepository = feeDetailRepository;
        this.courseFeedbackRepository = courseFeedbackRepository;
        this.academicCalendarRepository = academicCalendarRepository;
        this.contactInfoRepository = contactInfoRepository;
        this.familyInfoRepository = familyInfoRepository;
        this.studyPlanCourseRepository = studyPlanCourseRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Fixed seed for reproducible data
    private final Random rng = new Random(42L);

    // Grade table for completed semesters
    private static final String[] GRADES = {"A", "A-", "B+", "B", "B-", "C+"};
    private static final double[] GRADE_POINTS = {4.0, 3.67, 3.33, 3.0, 2.67, 2.33};

    @Override
    public void run(String... args) throws Exception {

        // Guard: skip if already seeded
        if (studentRepository.count() > 0) return;

        // ===================================================================
        // ACADEMIC CALENDAR (shared, created once)
        // ===================================================================
        seedAcademicCalendar();

        // ===================================================================
        // COURSES  (semesters 1-8)
        // ===================================================================

        // Semester 1 — Fall 2024
        Course cs1001 = createCourse("CS1001", "Introduction to Computing", 3, Course.CourseType.CORE, "Fall 2024");
        Course cs1002 = createCourse("CS1002", "Programming Fundamentals", 3, Course.CourseType.CORE, "Fall 2024");
        Course mt1001 = createCourse("MT1001", "Calculus and Analytical Geometry", 3, Course.CourseType.CORE, "Fall 2024");
        Course ee1001 = createCourse("EE1001", "Applied Physics", 3, Course.CourseType.CORE, "Fall 2024");
        Course hu1001 = createCourse("HU1001", "English Composition", 3, Course.CourseType.CORE, "Fall 2024");
        List<Course> sem1Courses = Arrays.asList(cs1001, cs1002, mt1001, ee1001, hu1001);

        // Semester 2 — Spring 2025
        Course cs2001 = createCourse("CS2001", "Object Oriented Programming", 4, Course.CourseType.CORE, "Spring 2025");
        Course cs2002 = createCourse("CS2002", "Data Structures", 4, Course.CourseType.CORE, "Spring 2025");
        Course mt2003 = createCourse("MT2003", "Linear Algebra", 3, Course.CourseType.CORE, "Spring 2025");
        Course cs2004 = createCourse("CS2004", "Digital Logic Design", 3, Course.CourseType.CORE, "Spring 2025");
        Course hs2005 = createCourse("HS2005", "Islamic Studies", 3, Course.CourseType.CORE, "Spring 2025");
        List<Course> sem2Courses = Arrays.asList(cs2001, cs2002, mt2003, cs2004, hs2005);

        // Semester 3 — Fall 2025
        Course cs3004 = createCourse("CS3004", "Computer Networks", 3, Course.CourseType.CORE, "Fall 2025");
        Course cs3005 = createCourse("CS3005", "Discrete Structures", 3, Course.CourseType.CORE, "Fall 2025");
        Course mt3006 = createCourse("MT3006", "Differential Equations", 3, Course.CourseType.CORE, "Fall 2025");
        Course hs3007 = createCourse("HS3007", "Pakistan Studies", 2, Course.CourseType.CORE, "Fall 2025");
        Course cs3008 = createCourse("CS3008", "Assembly Language", 3, Course.CourseType.CORE, "Fall 2025");
        List<Course> sem3Courses = Arrays.asList(cs3004, cs3005, mt3006, hs3007, cs3008);

        // Semester 4 — Spring 2026 (current)
        Course cs3001 = createCourse("CS3001", "Software Engineering", 3, Course.CourseType.CORE, "Spring 2026");
        Course cs3002 = createCourse("CS3002", "Database Systems", 4, Course.CourseType.CORE, "Spring 2026");
        Course cs3003 = createCourse("CS3003", "Operating Systems", 3, Course.CourseType.CORE, "Spring 2026");
        Course mt3005 = createCourse("MT3005", "Probability & Statistics", 3, Course.CourseType.CORE, "Spring 2026");
        Course hs3006 = createCourse("HS3006", "Technical Writing", 2, Course.CourseType.CORE, "Spring 2026");
        List<Course> sem4Courses = Arrays.asList(cs3001, cs3002, cs3003, mt3005, hs3006);

        // Semester 5 — Fall 2026
        Course cs4001 = createCourse("CS4001", "Artificial Intelligence", 3, Course.CourseType.CORE, "Fall 2026");
        Course cs4002 = createCourse("CS4002", "Compiler Construction", 3, Course.CourseType.CORE, "Fall 2026");
        Course cs4003 = createCourse("CS4003", "Computer Architecture", 3, Course.CourseType.CORE, "Fall 2026");
        Course cs4004 = createCourse("CS4004", "Theory of Automata", 3, Course.CourseType.CORE, "Fall 2026");
        Course hs4005 = createCourse("HS4005", "Professional Practices", 3, Course.CourseType.CORE, "Fall 2026");
        List<Course> sem5Courses = Arrays.asList(cs4001, cs4002, cs4003, cs4004, hs4005);

        // Semester 6 — Spring 2027
        Course cs5001 = createCourse("CS5001", "Design & Analysis of Algorithms", 3, Course.CourseType.CORE, "Spring 2027");
        Course cs5002 = createCourse("CS5002", "Parallel & Distributed Computing", 3, Course.CourseType.CORE, "Spring 2027");
        Course cs5003 = createCourse("CS5003", "Information Security", 3, Course.CourseType.ELECTIVE, "Spring 2027");
        Course cs5004 = createCourse("CS5004", "Machine Learning", 3, Course.CourseType.ELECTIVE, "Spring 2027");
        Course hs5005 = createCourse("HS5005", "Entrepreneurship", 3, Course.CourseType.CORE, "Spring 2027");
        List<Course> sem6Courses = Arrays.asList(cs5001, cs5002, cs5003, cs5004, hs5005);

        // Semester 7 — Fall 2027
        Course cs6001 = createCourse("CS6001", "Final Year Project I", 3, Course.CourseType.CORE, "Fall 2027");
        Course cs6002 = createCourse("CS6002", "Web Engineering", 3, Course.CourseType.ELECTIVE, "Fall 2027");
        Course cs6003 = createCourse("CS6003", "Cloud Computing", 3, Course.CourseType.ELECTIVE, "Fall 2027");
        Course cs6004 = createCourse("CS6004", "Deep Learning", 3, Course.CourseType.ELECTIVE, "Fall 2027");
        Course mt6005 = createCourse("MT6005", "Numerical Computing", 3, Course.CourseType.CORE, "Fall 2027");
        List<Course> sem7Courses = Arrays.asList(cs6001, cs6002, cs6003, cs6004, mt6005);

        // Semester 8 — Spring 2028
        Course cs7001 = createCourse("CS7001", "Final Year Project II", 3, Course.CourseType.CORE, "Spring 2028");
        Course cs7002 = createCourse("CS7002", "NLP", 3, Course.CourseType.ELECTIVE, "Spring 2028");
        Course cs7003 = createCourse("CS7003", "Computer Vision", 3, Course.CourseType.ELECTIVE, "Spring 2028");
        Course hs7004 = createCourse("HS7004", "Community Service", 1, Course.CourseType.CORE, "Spring 2028");
        List<Course> sem8Courses = Arrays.asList(cs7001, cs7002, cs7003, hs7004);

        // All semester course lists for study plan
        @SuppressWarnings("unchecked")
        List<Course>[] allSemCourses = new List[]{
                sem1Courses, sem2Courses, sem3Courses, sem4Courses,
                sem5Courses, sem6Courses, sem7Courses, sem8Courses
        };

        // Completed semester data: courses, semester label, total credits
        String[] completedSemesters = {"Fall 2024", "Spring 2025", "Fall 2025"};
        List<Course>[] completedCourses = new List[]{sem1Courses, sem2Courses, sem3Courses};
        int[] semCredits = {15, 17, 14}; // sum of credits per semester

        // ===================================================================
        // STUDENT DATA ARRAYS
        // ===================================================================

        String[] rollNumbers = {
                "24L-3072", "24L-3073", "24L-3074", "24L-3075", "24L-3076",
                "24L-3077", "24L-3078", "24L-3079", "24L-3080", "24L-3081",
                "24L-3082", "24L-3083", "24L-3084", "24L-3085", "24L-3086",
                "24L-3087", "24L-3088", "24L-3089", "24L-3090", "24L-3091"
        };

        String[] names = {
                "Suleman Ahmed", "Ahmad Hassan", "Fatima Zahra", "Muhammad Ali", "Ayesha Khan",
                "Usman Tariq", "Zainab Malik", "Bilal Asghar", "Hira Nawaz", "Saad Qureshi",
                "Maryam Iqbal", "Hassan Raza", "Sana Javed", "Omar Farooq", "Nimra Sheikh",
                "Talha Mehmood", "Amina Bibi", "Hamza Siddiqui", "Rabia Noor", "Danish Ahmed"
        };

        String[] genders = {
                "Male", "Male", "Female", "Male", "Female",
                "Male", "Female", "Male", "Female", "Male",
                "Female", "Male", "Female", "Male", "Female",
                "Male", "Female", "Male", "Female", "Male"
        };

        String[] fatherNames = {
                "Muhammad Saeed", "Hassan Nawaz", "Zaheer Abbas", "Ali Raza", "Imran Khan",
                "Tariq Mehmood", "Malik Riaz", "Asghar Ali", "Nawaz Sharif", "Qureshi Ahmad",
                "Iqbal Hussain", "Raza Muhammad", "Javed Akhtar", "Farooq Ahmad", "Sheikh Rashid",
                "Mehmood ul Hassan", "Muhammad Yousaf", "Siddiqui Anwar", "Noor Muhammad", "Ahmed Kamal"
        };

        String[] motherNames = {
                "Fatima Saeed", "Nasreen Hassan", "Rukhsana Zaheer", "Amna Ali", "Bushra Imran",
                "Saima Tariq", "Khadija Riaz", "Tahira Asghar", "Parveen Nawaz", "Samina Qureshi",
                "Zubaida Iqbal", "Nazia Raza", "Farzana Javed", "Sobia Farooq", "Rubina Sheikh",
                "Naheed Mehmood", "Shamim Yousaf", "Asma Siddiqui", "Salma Noor", "Naseem Ahmed"
        };

        String[] cities = {
                "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad",
                "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
                "Hyderabad", "Bahawalpur", "Sargodha", "Abbottabad", "Mardan",
                "Sahiwal", "Jhang", "Okara", "Kasur", "Sheikhupura"
        };

        String[] addresses = {
                "House 12, Street 5, DHA Phase 6", "Flat 4B, Gulshan-e-Iqbal Block 13",
                "House 45, F-8/3", "House 78, Satellite Town", "House 23, Peoples Colony No.1",
                "House 56, Shah Rukn-e-Alam Colony", "House 34, University Town",
                "House 89, Jinnah Town", "House 67, Cantt Area", "House 11, Model Town",
                "House 90, Latifabad Unit 7", "House 15, Model Town B",
                "House 43, University Road", "House 27, Supply Bazaar Road",
                "House 38, Sheikh Maltoon Town", "House 62, Farid Town",
                "House 71, Civil Lines", "House 19, Gulberg Colony",
                "House 54, Kot Radha Kishan Road", "House 82, Factory Area"
        };

        String[] postalCodes = {
                "54000", "75300", "44000", "46000", "38000",
                "60000", "25000", "87300", "51310", "52250",
                "71000", "63100", "40100", "22010", "23200",
                "57000", "35200", "56300", "55050", "39350"
        };

        String[] bloodGroups = {"O+", "A+", "B+", "AB+", "O-", "A-", "B+", "O+", "A+", "B+",
                "AB-", "O+", "A+", "B-", "O+", "A+", "B+", "AB+", "O-", "A+"};

        // Encoded passwords (first student different)
        String encodedPassword123 = passwordEncoder.encode("password123");
        String encodedStudent123 = passwordEncoder.encode("student123");

        // ===================================================================
        // LOOP OVER 20 STUDENTS
        // ===================================================================

        for (int s = 0; s < 20; s++) {
            String rollNo = rollNumbers[s];
            String password = (s == 0) ? encodedPassword123 : encodedStudent123;
            String section = (s % 2 == 0) ? "BSE-243A" : "BSE-243B";

            // --- Student ---
            Student student = createStudent(
                    rollNo, password, names[s], genders[s],
                    names[s].toLowerCase().replace(" ", ".") + "@nu.edu.pk",
                    LocalDate.of(2005, 1 + (s % 12), 1 + (s % 28)),
                    String.format("35202-%07d-%d", 1000000 + s * 111111, (s % 2 == 0) ? 7 : 2),
                    String.format("03%d-%07d", 10 + (s % 6), 1000000 + s * 123456),
                    bloodGroups[s], section
            );

            // --- Family Info ---
            createFamilyInfo(student, "Father", fatherNames[s],
                    String.format("35202-%07d-%d", 2000000 + s * 111111, 1));
            createFamilyInfo(student, "Mother", motherNames[s],
                    String.format("35202-%07d-%d", 3000000 + s * 111111, 2));

            // --- Contact Info ---
            createContactInfo(student, addresses[s], cities[s], postalCodes[s],
                    String.format("042-%08d", 30000000 + s * 100000),
                    String.format("03%d-%07d", 11 + (s % 5), 2000000 + s * 654321));

            // ===============================================================
            // ENROLLMENTS — Semesters 1-3 (completed, with grades)
            // ===============================================================
            double totalWeightedPoints = 0.0;
            int totalCreditsEarned = 0;

            for (int sem = 0; sem < 3; sem++) {
                List<Course> courses = completedCourses[sem];
                String semester = completedSemesters[sem];
                String enrollSection = (s % 2 == 0) ? "BSE-243A" : "BSE-243B";

                double semWeightedPoints = 0.0;
                int semTotalCredits = semCredits[sem];

                // Enrollments for semester 3 courses will also get feedback (SUBMITTED)
                List<Enrollment> sem3Enrollments = new ArrayList<>();

                for (Course course : courses) {
                    int gradeIdx = rng.nextInt(GRADES.length);
                    String grade = GRADES[gradeIdx];
                    double points = GRADE_POINTS[gradeIdx];

                    Enrollment enrollment = createEnrollment(student, course, semester, enrollSection,
                            grade, points, "Completed", "ENROLLED");

                    semWeightedPoints += points * course.getCreditHours();

                    if (sem == 2) {
                        sem3Enrollments.add(enrollment);
                    }
                }

                // SGPA for this semester
                double sgpa = Math.round((semWeightedPoints / semTotalCredits) * 100.0) / 100.0;

                // Running CGPA
                totalWeightedPoints += semWeightedPoints;
                totalCreditsEarned += semTotalCredits;
                double cgpa = Math.round((totalWeightedPoints / totalCreditsEarned) * 100.0) / 100.0;

                // Transcript entry
                createTranscript(student, semester, semTotalCredits, semTotalCredits, sgpa, cgpa);

                // Course feedback for semester 3 courses (SUBMITTED)
                if (sem == 2) {
                    for (Enrollment en : sem3Enrollments) {
                        int rating = 3 + rng.nextInt(3); // 3, 4, or 5
                        String[] comments = {"Good course", "Very informative", "Enjoyed the lectures",
                                "Great teaching", "Well structured"};
                        createCourseFeedback(en, CourseFeedback.FeedbackStatus.SUBMITTED,
                                LocalDate.of(2025, 12, 15 + rng.nextInt(10)),
                                rating, comments[rng.nextInt(comments.length)]);
                    }
                }
            }

            // ===============================================================
            // ENROLLMENTS — Semester 4, Spring 2026 (in progress)
            // ===============================================================
            String currentSection = (s % 2 == 0) ? "BSE-243A" : "BSE-243B";
            List<Enrollment> currentEnrollments = new ArrayList<>();

            for (Course course : sem4Courses) {
                Enrollment enrollment = createEnrollment(student, course, "Spring 2026", currentSection,
                        null, null, null, "IN_PROGRESS");
                currentEnrollments.add(enrollment);
            }

            // ===============================================================
            // ATTENDANCE — Spring 2026 (8-12 lectures per course)
            // ===============================================================
            for (Enrollment enrollment : currentEnrollments) {
                int numLectures = 8 + rng.nextInt(5); // 8 to 12
                generateAttendance(enrollment, numLectures, LocalDate.of(2026, 1, 27), rng);
            }

            // ===============================================================
            // MARKS — Spring 2026 (2-4 evaluations per course)
            // ===============================================================
            for (Enrollment enrollment : currentEnrollments) {
                generateMarks(enrollment, rng);
            }

            // ===============================================================
            // COURSE FEEDBACK — Semester 4 courses (PENDING)
            // ===============================================================
            for (Enrollment enrollment : currentEnrollments) {
                createCourseFeedback(enrollment, CourseFeedback.FeedbackStatus.PENDING,
                        null, null, null);
            }

            // ===============================================================
            // FEE CHALLANS — 4 challans (semesters 1-3 PAID, semester 4 UNPAID)
            // ===============================================================
            int baseAmount = 175000 + rng.nextInt(20001); // 175000-195000
            String challanPrefix = String.format("CHN-%s", rollNo.replace("L-", ""));

            // Semester 1 — Fall 2024 (PAID)
            FeeChallan challan1 = createChallan(student, "Fall 2024",
                    challanPrefix + "-2024-001",
                    175000.0 + rng.nextInt(10000),
                    LocalDate.of(2024, 8, 20),
                    FeeChallan.ChallanStatus.PAID,
                    LocalDate.of(2024, 8, 1),
                    LocalDate.of(2024, 8, 15 + rng.nextInt(5)));

            // Fee details for first challan only
            if (s == 0 || rng.nextInt(3) == 0) {
                createFeeDetails(challan1);
            } else {
                createFeeDetails(challan1);
            }

            // Semester 2 — Spring 2025 (PAID)
            createChallan(student, "Spring 2025",
                    challanPrefix + "-2025-001",
                    178000.0 + rng.nextInt(12000),
                    LocalDate.of(2025, 1, 20),
                    FeeChallan.ChallanStatus.PAID,
                    LocalDate.of(2025, 1, 3),
                    LocalDate.of(2025, 1, 14 + rng.nextInt(6)));

            // Semester 3 — Fall 2025 (PAID)
            createChallan(student, "Fall 2025",
                    challanPrefix + "-2025-002",
                    180000.0 + rng.nextInt(15000),
                    LocalDate.of(2025, 8, 20),
                    FeeChallan.ChallanStatus.PAID,
                    LocalDate.of(2025, 8, 1),
                    LocalDate.of(2025, 8, 12 + rng.nextInt(8)));

            // Semester 4 — Spring 2026 (UNPAID)
            createChallan(student, "Spring 2026",
                    challanPrefix + "-2026-001",
                    185000.0 + rng.nextInt(10000),
                    LocalDate.of(2026, 1, 20),
                    FeeChallan.ChallanStatus.UNPAID,
                    LocalDate.of(2026, 1, 5),
                    null);

            // ===============================================================
            // STUDY PLAN — all 8 semesters
            // ===============================================================
            for (int semIdx = 0; semIdx < allSemCourses.length; semIdx++) {
                for (Course course : allSemCourses[semIdx]) {
                    createStudyPlanCourse(student, course, "Semester " + (semIdx + 1));
                }
            }

        } // end student loop

        System.out.println("NUKED Portal \u2014 Seeded 20 students! Login: 24L-3072/password123 or 24L-30XX/student123");
    }

    // =====================================================================
    // HELPER METHODS
    // =====================================================================

    private void seedAcademicCalendar() {
        AcademicCalendar registration = new AcademicCalendar();
        registration.setEventName("Registration");
        registration.setStartDate(LocalDate.of(2026, 1, 14));
        registration.setEndDate(LocalDate.of(2026, 2, 1));
        academicCalendarRepository.save(registration);

        AcademicCalendar classes = new AcademicCalendar();
        classes.setEventName("Classes");
        classes.setStartDate(LocalDate.of(2026, 1, 19));
        classes.setEndDate(LocalDate.of(2026, 5, 8));
        academicCalendarRepository.save(classes);

        AcademicCalendar feedback1 = new AcademicCalendar();
        feedback1.setEventName("Online Feedback #1");
        feedback1.setStartDate(LocalDate.of(2026, 2, 16));
        feedback1.setEndDate(LocalDate.of(2026, 2, 20));
        academicCalendarRepository.save(feedback1);

        AcademicCalendar feedback2 = new AcademicCalendar();
        feedback2.setEventName("Online Feedback #2");
        feedback2.setStartDate(LocalDate.of(2026, 5, 4));
        feedback2.setEndDate(LocalDate.of(2026, 5, 8));
        academicCalendarRepository.save(feedback2);

        AcademicCalendar withdraw = new AcademicCalendar();
        withdraw.setEventName("Online Withdraw Request");
        withdraw.setStartDate(LocalDate.of(2026, 1, 13));
        withdraw.setEndDate(LocalDate.of(2026, 5, 15));
        academicCalendarRepository.save(withdraw);

        AcademicCalendar retake = new AcademicCalendar();
        retake.setEventName("Online Retake Request");
        retake.setStartDate(null);
        retake.setEndDate(null);
        academicCalendarRepository.save(retake);
    }

    private Student createStudent(String rollNo, String encodedPassword, String name,
                                  String gender, String email, LocalDate dob, String cnic,
                                  String mobileNo, String bloodGroup, String section) {
        Student student = new Student();
        student.setRollNo(rollNo);
        student.setPassword(encodedPassword);
        student.setName(name);
        student.setGender(gender);
        student.setEmail(email);
        student.setDob(dob);
        student.setCnic(cnic);
        student.setMobileNo(mobileNo);
        student.setBloodGroup(bloodGroup);
        student.setNationality("Pakistani");
        student.setDegree("BS(SE)");
        student.setBatch("Fall 2024");
        student.setSection(section);
        student.setCampus("Lahore");
        student.setStatus("Current");
        return studentRepository.save(student);
    }

    private Course createCourse(String code, String name, int creditHours,
                                Course.CourseType type, String semester) {
        Course course = new Course();
        course.setCode(code);
        course.setName(name);
        course.setCreditHours(creditHours);
        course.setType(type);
        course.setSemester(semester);
        return courseRepository.save(course);
    }

    private Enrollment createEnrollment(Student student, Course course, String semester,
                                        String section, String grade, Double points,
                                        String remarks, String status) {
        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setSemester(semester);
        enrollment.setSection(section);
        enrollment.setGrade(grade);
        enrollment.setPoints(points);
        enrollment.setRemarks(remarks);
        enrollment.setStatus(status);
        return enrollmentRepository.save(enrollment);
    }

    private void createTranscript(Student student, String semester,
                                  int crAttempted, int crEarned, double sgpa, double cgpa) {
        Transcript transcript = new Transcript();
        transcript.setStudent(student);
        transcript.setSemester(semester);
        transcript.setCrAttempted(crAttempted);
        transcript.setCrEarned(crEarned);
        transcript.setSgpa(sgpa);
        transcript.setCgpa(cgpa);
        transcriptRepository.save(transcript);
    }

    private void generateAttendance(Enrollment enrollment, int numLectures,
                                    LocalDate startDate, Random rng) {
        LocalDate date = startDate;
        for (int i = 0; i < numLectures; i++) {
            Attendance att = new Attendance();
            att.setEnrollment(enrollment);
            att.setLectureNo(i + 1);
            att.setDate(date);
            att.setDurationHrs(1.5);

            // 80% P, 15% A, 5% L
            int roll = rng.nextInt(100);
            if (roll < 80) {
                att.setPresence("P");
            } else if (roll < 95) {
                att.setPresence("A");
            } else {
                att.setPresence("L");
            }

            attendanceRepository.save(att);

            // Increment by 2 or 3 days alternating (Mon-Wed-Fri pattern)
            if (i % 2 == 0) {
                date = date.plusDays(2);
            } else {
                date = date.plusDays(3);
            }
        }
    }

    private void generateMarks(Enrollment enrollment, Random rng) {
        // Each course gets 2-4 evaluations
        int numEvals = 2 + rng.nextInt(3); // 2, 3, or 4

        String[][] evalDefs = {
                {"Quiz 1", "QUIZ", "5.0", "10.0"},
                {"Quiz 2", "QUIZ", "5.0", "10.0"},
                {"Assignment 1", "ASSIGNMENT", "5.0", "20.0"},
                {"Sessional 1", "SESSIONAL", "15.0", "40.0"}
        };

        for (int i = 0; i < numEvals; i++) {
            String[] def = evalDefs[i];

            double total = Double.parseDouble(def[3]);
            double weightage = Double.parseDouble(def[2]);

            // Obtained: 60-95% of total
            double obtainedPct = 0.60 + rng.nextDouble() * 0.35;
            double obtained = Math.round(total * obtainedPct * 10.0) / 10.0;

            // Class average: 55-75% of total
            double avgPct = 0.55 + rng.nextDouble() * 0.20;
            double average = Math.round(total * avgPct * 10.0) / 10.0;

            // Std dev: 8-18% of total
            double stdDev = Math.round(total * (0.08 + rng.nextDouble() * 0.10) * 10.0) / 10.0;

            // Min: 30-50% of total
            double min = Math.round(total * (0.30 + rng.nextDouble() * 0.20) * 10.0) / 10.0;

            // Max: 88-100% of total
            double max = Math.round(total * (0.88 + rng.nextDouble() * 0.12) * 10.0) / 10.0;

            Marks marks = new Marks();
            marks.setEnrollment(enrollment);
            marks.setEvaluationType(Marks.EvaluationType.valueOf(def[1]));
            marks.setEvaluationName(def[0]);
            marks.setWeightage(weightage);
            marks.setObtained(obtained);
            marks.setTotal(total);
            marks.setAverage(average);
            marks.setStdDev(stdDev);
            marks.setMin(min);
            marks.setMax(max);
            marksRepository.save(marks);
        }
    }

    private FeeChallan createChallan(Student student, String semester, String challanNo,
                                     double amount, LocalDate dueDate,
                                     FeeChallan.ChallanStatus status,
                                     LocalDate generatedDate, LocalDate paidDate) {
        FeeChallan challan = new FeeChallan();
        challan.setStudent(student);
        challan.setSemester(semester);
        challan.setChallanNo(challanNo);
        challan.setAmount(amount);
        challan.setDueDate(dueDate);
        challan.setStatus(status);
        challan.setGeneratedDate(generatedDate);
        challan.setPaidDate(paidDate);
        return feeChallanRepository.save(challan);
    }

    private void createFeeDetails(FeeChallan challan) {
        FeeDetail tuition = new FeeDetail();
        tuition.setFeeChallan(challan);
        tuition.setDescription("Tuition Fee");
        tuition.setArrears(0.0);
        tuition.setDue(165000.0);
        tuition.setDiscount(18500.0);
        tuition.setSponsored(0.0);
        tuition.setCollection(146500.0);
        tuition.setBalance(0.0);
        tuition.setInstrumentNo("TXN-" + (70000 + rng.nextInt(30000)));
        tuition.setInstrumentType("Online Banking");
        feeDetailRepository.save(tuition);

        FeeDetail examFee = new FeeDetail();
        examFee.setFeeChallan(challan);
        examFee.setDescription("Exam Fee");
        examFee.setArrears(0.0);
        examFee.setDue(5000.0);
        examFee.setDiscount(0.0);
        examFee.setSponsored(0.0);
        examFee.setCollection(5000.0);
        examFee.setBalance(0.0);
        examFee.setInstrumentNo("TXN-" + (70000 + rng.nextInt(30000)));
        examFee.setInstrumentType("KuickPay");
        feeDetailRepository.save(examFee);

        FeeDetail libraryFee = new FeeDetail();
        libraryFee.setFeeChallan(challan);
        libraryFee.setDescription("Library Fee");
        libraryFee.setArrears(0.0);
        libraryFee.setDue(5000.0);
        libraryFee.setDiscount(0.0);
        libraryFee.setSponsored(0.0);
        libraryFee.setCollection(5000.0);
        libraryFee.setBalance(0.0);
        libraryFee.setInstrumentNo("TXN-" + (70000 + rng.nextInt(30000)));
        libraryFee.setInstrumentType("Online Banking");
        feeDetailRepository.save(libraryFee);

        FeeDetail itFee = new FeeDetail();
        itFee.setFeeChallan(challan);
        itFee.setDescription("IT Services Fee");
        itFee.setArrears(0.0);
        itFee.setDue(10000.0);
        itFee.setDiscount(0.0);
        itFee.setSponsored(0.0);
        itFee.setCollection(10000.0);
        itFee.setBalance(0.0);
        itFee.setInstrumentNo("TXN-" + (70000 + rng.nextInt(30000)));
        itFee.setInstrumentType("Online Banking");
        feeDetailRepository.save(itFee);
    }

    private void createCourseFeedback(Enrollment enrollment, CourseFeedback.FeedbackStatus status,
                                      LocalDate submittedDate, Integer rating, String comments) {
        CourseFeedback feedback = new CourseFeedback();
        feedback.setEnrollment(enrollment);
        feedback.setStatus(status);
        feedback.setSubmittedDate(submittedDate);
        feedback.setRating(rating);
        feedback.setComments(comments);
        courseFeedbackRepository.save(feedback);
    }

    private void createFamilyInfo(Student student, String relation, String name, String cnic) {
        FamilyInfo info = new FamilyInfo();
        info.setStudent(student);
        info.setRelation(relation);
        info.setName(name);
        info.setCnic(cnic);
        info.setTaxWithholding(relation.equals("Father") ? "Filer" : "Non-Filer");
        familyInfoRepository.save(info);
    }

    private void createContactInfo(Student student, String address, String city,
                                   String postalCode, String phone, String emergencyContact) {
        ContactInfo info = new ContactInfo();
        info.setStudent(student);
        info.setAddress(address);
        info.setCity(city);
        info.setPostalCode(postalCode);
        info.setPhone(phone);
        info.setEmergencyContact(emergencyContact);
        contactInfoRepository.save(info);
    }

    private void createStudyPlanCourse(Student student, Course course, String plannedSemester) {
        StudyPlanCourse spc = new StudyPlanCourse();
        spc.setStudent(student);
        spc.setCourse(course);
        spc.setPlannedSemester(plannedSemester);
        studyPlanCourseRepository.save(spc);
    }
}
