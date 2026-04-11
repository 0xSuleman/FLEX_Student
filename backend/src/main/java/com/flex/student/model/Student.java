package com.flex.student.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "students")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String rollNo;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    private String gender;

    @Column(unique = true)
    private String email;

    private LocalDate dob;

    private String cnic;

    private String mobileNo;

    private String bloodGroup;

    private String nationality;

    private String degree;

    private String batch;

    private String section;

    private String campus;

    private String status;

    private String profileImageUrl;
}
