package com.nuked.portal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "staff_users")
public class StaffUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    /** Role enum value as a string — HOD, AO, ASST_AO, MANAGER, ASST_MANAGER, EXAM_OFFICE, FINANCE, IT_ADMIN, REGISTRAR, ADMISSIONS, CAO. */
    @Column(nullable = false, length = 32)
    private String role;

    private String designation;

    private String department;

    @Column(unique = true)
    private String employeeId;

    @Column(unique = true)
    private String email;

    private String campus;
}
