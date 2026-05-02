package com.nuked.portal.repository;

import com.nuked.portal.model.StaffUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffUserRepository extends JpaRepository<StaffUser, Long> {
    Optional<StaffUser> findByUsername(String username);
    Optional<StaffUser> findByUsernameAndRole(String username, String role);
}
