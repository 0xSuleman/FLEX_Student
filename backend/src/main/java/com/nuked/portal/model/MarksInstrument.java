package com.nuked.portal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "marks_instruments",
        uniqueConstraints = @UniqueConstraint(columnNames = {"faculty_section_id", "name"}))
public class MarksInstrument {

    public enum Category { QUIZ, ASSIGNMENT, SESSIONAL_1, SESSIONAL_2, FINAL }

    public enum PublishState {
        DRAFT,           // faculty editing, hidden from students
        PUBLISHED        // visible to students (mid-sem auto-publishes; FINAL only after HOD approves)
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_section_id", nullable = false)
    private FacultySection facultySection;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int displayOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PublishState publishState = PublishState.DRAFT;

    private LocalDateTime publishedAt;

    @OneToMany(mappedBy = "instrument", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    private List<MarksComponent> components = new ArrayList<>();
}
