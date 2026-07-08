package com.barak.lifeOS.pomodoro;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PomodoroRepository extends JpaRepository<PomodoroSession, UUID>{
    // Active session — only one should exist at a time per user
    Optional<PomodoroSession> findByUserIdAndStatus(UUID userId, SessionStatus status);

    // All sessions for a user between two timestamps — for summary
    @Query("""
        SELECT p FROM PomodoroSession p
        WHERE p.user.id = :userId
        AND p.startTime >= :from
        AND p.startTime < :to
    """)
    List<PomodoroSession> findByUserIdAndStartTimeBetween(
        @Param("userId") UUID userId,
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    // For dashboard — today's sessions
    @Query("""
        SELECT p FROM PomodoroSession p
        WHERE p.user.id = :userId
        AND p.startTime >= :from
        AND p.startTime < :to
        AND p.sessionType = 'FOCUS'
    """)
    List<PomodoroSession> findFocusSessionsForPeriod(
        @Param("userId") UUID userId,
        @Param("from") Instant from,
        @Param("to") Instant to
    );
}
