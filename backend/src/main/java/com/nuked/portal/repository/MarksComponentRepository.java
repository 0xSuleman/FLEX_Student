package com.nuked.portal.repository;

import com.nuked.portal.model.MarksComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MarksComponentRepository extends JpaRepository<MarksComponent, Long> {
}
