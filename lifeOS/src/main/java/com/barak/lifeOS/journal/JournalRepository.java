package com.barak.lifeOS.journal;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.barak.lifeOS.user.User;

public interface JournalRepository extends JpaRepository<JournalEntry, UUID>{
    Page<JournalEntry> findAllByUserAndDeletedAtNull(User user,Pageable pageable);
}
