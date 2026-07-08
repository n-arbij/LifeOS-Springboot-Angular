package com.barak.lifeOS.habit;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.barak.lifeOS.user.User;

public interface HabitRepository extends JpaRepository<Habit, UUID>{

    Page<Habit> findByUserAndActiveTrue(User user, Pageable pageable);

    Optional<Habit> findByIdAndUserAndDeletedAtNull(UUID id, User user);

}
