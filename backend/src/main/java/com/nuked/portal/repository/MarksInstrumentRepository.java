package com.nuked.portal.repository;

import com.nuked.portal.model.MarksInstrument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarksInstrumentRepository extends JpaRepository<MarksInstrument, Long> {
    List<MarksInstrument> findByFacultySectionIdOrderByDisplayOrderAsc(Long facultySectionId);
}
