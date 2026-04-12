package com.nuked.portal.repository;

import com.nuked.portal.model.AcademicCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AcademicCalendarRepository extends JpaRepository<AcademicCalendar, Long> {
}
