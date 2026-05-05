package com.nuked.portal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Faculty-uploaded attendance sheet template (per section). Used by the
 * "download today's attendance sheet" feature: backend opens this xlsx,
 * appends today's date column with P/A per student, returns the modified
 * copy. The original template is preserved.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "attendance_templates",
        uniqueConstraints = @UniqueConstraint(columnNames = "faculty_section_id"))
public class AttendanceTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_section_id", nullable = false, unique = true)
    private FacultySection facultySection;

    @Column(nullable = false)
    private String filename;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] fileBytes;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;
}
