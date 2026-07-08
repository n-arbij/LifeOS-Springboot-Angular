package com.barak.lifeOS.pomodoro;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.barak.lifeOS.common.Helper;
import com.barak.lifeOS.exception.ResourceNotFoundException;
import com.barak.lifeOS.user.User;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PomodoroService {
    private final PomodoroRepository pomodoroRepository;
    private final Helper helper;

    @Transactional
    public PomodoroDto.Response start(PomodoroDto.CreateRequest request){
        User user = helper.getCurrentUser();

        // Cancel any running session before starting a new one
        pomodoroRepository
            .findByUserIdAndStatus(user.getId(), SessionStatus.RUNNING)
            .ifPresent(existing -> {
                existing.setStatus(SessionStatus.CANCELLED);
                existing.setEndTime(Instant.now());
                pomodoroRepository.save(existing);
            });

        PomodoroSession session = new PomodoroSession();
        session.setUser(user);
        session.setSessionType(request.sessionType());
        session.setStatus(SessionStatus.RUNNING);
        session.setStartTime(Instant.now());
        session.setPlannedDurationMinutes(request.plannedDurationMinutes());

        return PomodoroDto.Response.fromEntity(pomodoroRepository.save(session));
    }

    @Transactional
    public PomodoroDto.Response update(UUID sessionId, PomodoroDto.UpdateRequest request){
        User user = helper.getCurrentUser();

        PomodoroSession session = pomodoroRepository.findById(sessionId).orElseThrow(
            () -> new ResourceNotFoundException("Session not found")
        );

        if (!session.getUser().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                "You do not own this session"
            );
        }

        session.setStatus(request.status());

        if (request.status() == SessionStatus.COMPLETED) {
            session.setCompleted(true);
            session.setEndTime(Instant.now());
        }

        if (request.status() == SessionStatus.CANCELLED) {
            session.setEndTime(Instant.now());
        }

        return PomodoroDto.Response.fromEntity(pomodoroRepository.save(session));
    }

    public PomodoroDto.Response getActive() {
        User user = helper.getCurrentUser();

        return pomodoroRepository
            .findByUserIdAndStatus(user.getId(), SessionStatus.RUNNING)
            .map(PomodoroDto.Response::fromEntity)
            .orElse(null);
    }

    public PomodoroDto.SummaryResponse getSummary(LocalDate date) {
        User user = helper.getCurrentUser();

        Instant from = date.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant to   = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        List<PomodoroSession> sessions = pomodoroRepository
            .findByUserIdAndStartTimeBetween(user.getId(), from, to);

        int completedSessions = (int) sessions.stream()
            .filter(s -> s.getSessionType() == SessionType.FOCUS && s.isCompleted())
            .count();

        int cancelledSessions = (int) sessions.stream()
            .filter(s -> s.getSessionType() == SessionType.FOCUS &&
                         s.getStatus() == SessionStatus.CANCELLED)
            .count();

        int totalFocusMinutes = sessions.stream()
            .filter(s -> s.getSessionType() == SessionType.FOCUS &&
                         s.isCompleted() &&
                         s.getStartTime() != null &&
                         s.getEndTime() != null)
            .mapToInt(s -> (int) java.time.Duration.between(
                s.getStartTime(), s.getEndTime()).toMinutes())
            .sum();

        int totalBreakMinutes = sessions.stream()
            .filter(s -> (s.getSessionType() == SessionType.SHORT_BREAK ||
                          s.getSessionType() == SessionType.LONG_BREAK) &&
                          s.isCompleted() &&
                          s.getStartTime() != null &&
                          s.getEndTime() != null)
            .mapToInt(s -> (int) java.time.Duration.between(
                s.getStartTime(), s.getEndTime()).toMinutes())
            .sum();

        return new PomodoroDto.SummaryResponse(
            date.toString(),
            completedSessions,
            cancelledSessions,
            totalFocusMinutes,
            totalBreakMinutes
        );
    }
}
