package com.nuked.portal;

import com.nuked.portal.model.StaffUser;
import com.nuked.portal.repository.StaffUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds one demo user per non-faculty staff role. Idempotent — short-circuits
 * once at least one StaffUser exists.
 */
@Component
@Order(3)
public class StaffDataInitializer implements CommandLineRunner {

    private final StaffUserRepository staffRepo;
    private final PasswordEncoder passwordEncoder;

    public StaffDataInitializer(StaffUserRepository staffRepo, PasswordEncoder passwordEncoder) {
        this.staffRepo = staffRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (staffRepo.count() > 0) return;

        seed("hod.cs",        "HOD",          "Dr. Tariq Mahmood",        "Head of Department · CS",  "Computer Science", "EMP-LHR-201");
        seed("ao.foc",        "AO",           "Asma Ali",                 "Academic Officer",         "Faculty of Computing", "EMP-LHR-301");
        seed("asst.ao.foc",   "ASST_AO",      "Bilal Tariq",              "Asst. Academic Officer",   "Faculty of Computing", "EMP-LHR-302");
        seed("manager.foc",   "MANAGER",      "Saadia Rehman",            "Manager (Academics)",      "Faculty of Computing", "EMP-LHR-303");
        seed("asst.mgr.foc",  "ASST_MANAGER", "Faisal Ahmed",             "Asst. Manager (Academics)","Faculty of Computing", "EMP-LHR-304");
        seed("exam.office",   "EXAM_OFFICE",  "Sana Khan",                "Exam Office",              "Examination Office",   "EMP-LHR-401");
        seed("finance.lhr",   "FINANCE",      "Imran Sheikh",             "Finance Officer",          "Finance & Accounts",   "EMP-LHR-501");
        seed("it.admin",      "IT_ADMIN",     "Hassan Aziz",              "IT Administrator",         "IT Services",          "EMP-LHR-601");
        seed("registrar",     "REGISTRAR",    "Dr. Ayesha Khan",          "Registrar",               "Registrar Office",     "EMP-LHR-701");
        seed("admissions",    "ADMISSIONS",   "Salman Iqbal",             "Admissions Officer",       "Admissions Office",    "EMP-LHR-801");
        seed("cao.hq",        "CAO",          "Nadia Hussain",            "Director, Central Academic Office", "Central Academic Office", "EMP-HQ-001");
    }

    private void seed(String username, String role, String name, String designation, String department, String employeeId) {
        StaffUser u = new StaffUser();
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode("password123"));
        u.setName(name);
        u.setRole(role);
        u.setDesignation(designation);
        u.setDepartment(department);
        u.setEmployeeId(employeeId);
        u.setEmail(username.replace('.', '_') + "@nu.edu.pk");
        u.setCampus("Lahore");
        staffRepo.save(u);
    }
}
