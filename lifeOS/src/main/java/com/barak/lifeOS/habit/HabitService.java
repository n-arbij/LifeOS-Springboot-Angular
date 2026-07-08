package com.barak.lifeOS.habit;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.barak.lifeOS.common.Helper;
import com.barak.lifeOS.exception.BadRequestException;
import com.barak.lifeOS.exception.ResourceNotFoundException;
import com.barak.lifeOS.user.User;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HabitService {
    private final HabitRepository habitRepository;
    private final HabitLogRepository logRepository;
    private final Helper helper;

    public Page<HabitDto.Response> getAll(Pageable pageable){
        User user = helper.getCurrentUser();
        return habitRepository.findByUserAndActiveTrue(user, pageable)
        .map(habit -> {
            StreakResult streak = calculateStreak(habit);
            return HabitDto.Response.fromEntity(habit, streak.current(), streak.longest());
        });
    }

    public HabitDto.Response getById(UUID id){
        User user = helper.getCurrentUser();
        Habit habit = findOwnedHabit(id, user);
        StreakResult streak = calculateStreak(habit);
        return HabitDto.Response.fromEntity(habit, streak.current(), streak.longest());
    }

    @Transactional
    public HabitDto.Response createHabit(HabitDto.CreateRequest request){
        validate(request);

        Habit habit = new Habit();
        habit.setUser(helper.getCurrentUser());
        habit.setName(request.name());
        habit.setDescription(request.description());
        habit.setHabitType(request.habitType());
        habit.setFrequencyType(request.frequencyType());
        habit.setCustomDaysMask(request.customDayMask());
        habit.setTargetValue(request.targetValue());
        habit.setUnit(request.unit());
        habit.setStartDate(request.startDate());
        habit.setEndDate(request.endDate());
        habit.setColor(request.color() != null ? request.color() : "#6366f1");

        Habit saved = habitRepository.save(habit);
        return HabitDto.Response.fromEntity(saved, 0, 0);
    }

    @Transactional
    public HabitDto.Response updateHabit(UUID id, HabitDto.UpdateRequest request){
        Habit habit = findOwnedHabit(id, helper.getCurrentUser());

        if(request.name() != null) habit.setName(request.name());
        if(request.description() != null) habit.setDescription(request.description());
        if(request.frequencyType() != null) habit.setFrequencyType(request.frequencyType());
        if(request.customDayMask() != null) habit.setCustomDaysMask(request.customDayMask());
        if(request.targetValue() != null) habit.setTargetValue(request.targetValue());
        if(request.unit() != null) habit.setUnit(request.unit());
        if(request.color() != null) habit.setColor(request.color());
        Habit saved = habitRepository.save(habit);

        StreakResult streak = calculateStreak(saved);
        return HabitDto.Response.fromEntity(habit, streak.current, streak.longest);
    }

    @Transactional
    public HabitDto.Response deleteHabit(UUID id){
        Habit habit = findOwnedHabit(id, helper.getCurrentUser());
        habit.setDeletedAt(Instant.now());
        habitRepository.save(habit);

        return HabitDto.Response.fromEntity(habit, 0, 0);
    }

    @Transactional
    public HabitLogDto.Response log(UUID habitId, HabitLogDto.LogRequest request){
        Habit habit = findOwnedHabit(habitId, helper.getCurrentUser());

        if(habit.getHabitType() == HabitType.QUANTITATIVE && request.value() == null){
            throw new BadRequestException("Value is required for quantitative habits");
        }

        HabitLog log = logRepository.findByHabitAndLogDate(habit, request.logDate())
                    .orElse(new HabitLog());

        log.setHabit(habit);
        log.setLogDate(request.logDate());
        log.setCompleted(resolveCompletion(habit, request));
        log.setValue(request.value());
        log.setNotes(request.notes());
        log.setLoggedAt(Instant.now());
        logRepository.save(log);

        return HabitLogDto.Response.fromEntity(log);
    }

    public List<HabitLogDto.Response> getLogsForDate(LocalDate date){
        return logRepository.findByUserAndLogDate(helper.getCurrentUser(), date)
                .stream()
                .map(HabitLogDto.Response::fromEntity)
                .toList();
    }

    public HabitLogDto.WeekSummary getWeekSummary(UUID habitId, LocalDate weekStart){
        Habit habit = findOwnedHabit(habitId, helper.getCurrentUser());
        LocalDate weekEnd = weekStart.plusDays(7);

        List<HabitLog> logs = logRepository.findByHabitAndDateRange(habit, weekStart, weekEnd);

        Map<LocalDate, HabitLog> logsByDate = logs.stream()
            .collect(Collectors.toMap(HabitLog::getLogDate, l -> l));

        List<HabitLogDto.DaySummary> days = weekStart.datesUntil(weekEnd.plusDays(1))
                .map(date -> {
                    boolean scheduled = isScheduledForDate(habit, date);
                    HabitLog log = logsByDate.get(date);
                    return new HabitLogDto.DaySummary(
                        date,
                        scheduled,
                        log != null && log.isCompleted(),
                        log != null ? log.getValue() : null
                    );
                })
                .toList();
        
        return new HabitLogDto.WeekSummary(weekStart, weekEnd, days);
    }

    private StreakResult calculateStreak(Habit habit){
        List<HabitLog> logs = logRepository.findByHabitOrderByLogDateDesc(habit);  

        List<LocalDate> completedDates = logs.stream()
            .filter(HabitLog::isCompleted)
            .filter(log -> isScheduledForDate(habit, log.getLogDate()))
            .map(HabitLog::getLogDate)
            .sorted(Comparator.reverseOrder())
            .toList();

        if(completedDates.isEmpty()) return new StreakResult(0, 0);

        int currentStreak = computeCurrentStreak(habit, completedDates);
        int longestStreak = computeLongestStreak(habit, completedDates);

        return new StreakResult(currentStreak, longestStreak);
    }

    private int computeCurrentStreak(Habit habit, List<LocalDate> completedDates){
        LocalDate today = LocalDate.now();
        LocalDate checkDate = today;

        if(isScheduledForDate(habit, checkDate)) {
            checkDate = getPreviousScheduledDate(habit, checkDate);
        }

        if(!completedDates.contains(checkDate)){
            LocalDate previous = getPreviousScheduledDate(habit, checkDate);
            if (previous == null || !completedDates.contains(previous)) return 0;
            checkDate = previous;
        }

        int streak = 0;
        while(checkDate != null && completedDates.contains(checkDate)){
            streak++;
            checkDate = getPreviousScheduledDate(habit, checkDate);
        }
        return streak;
    }

    private int computeLongestStreak(Habit habit, List<LocalDate> completedDates){
        List<LocalDate> ascending = completedDates.stream()
            .sorted()
            .toList();
        
        int longest = 0;
        int current = 0;
        LocalDate previous = null;

        for(LocalDate date : ascending){
            if(previous == null){
                current = 1;
            } else {
                LocalDate expectedNext = getNextScheduledDate(habit, previous);
                current = date.equals(expectedNext) ? current + 1: 1;
            }
            longest = Math.max(longest, current);
            previous = date;
        }

        return longest;
    }

    private boolean isScheduledForDate(Habit habit, LocalDate date) {
        if (date.isBefore(habit.getStartDate())) return false;
        if (habit.getEndDate() != null && date.isAfter(habit.getEndDate())) return false;

        return switch (habit.getFrequencyType()) {
            case DAILY -> true;
            case MON_TO_FRI -> {
                DayOfWeek day = date.getDayOfWeek();
                yield day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY;
            }
            case WEEKLY, CUSTOM_DAYS -> {
                if (habit.getCustomDaysMask() == null) yield false;
                yield (habit.getCustomDaysMask() & getDayBit(date.getDayOfWeek())) != 0;
            }
        };
    }

    private LocalDate getPreviousScheduledDate(Habit habit, LocalDate from){
        LocalDate candidate = from.minusDays(1);
        for(int i=0; i<7; i++){
            if(isScheduledForDate(habit, candidate)) return candidate;
            candidate = candidate.minusDays(1);
        }
        return null;
    }

    private LocalDate getNextScheduledDate(Habit habit, LocalDate from){
        LocalDate candidate = from.plusDays(1);
        for(int i = 0; i < 7; i++){
            if(isScheduledForDate(habit, candidate)) return candidate;
            candidate = candidate.plusDays(1);
        }
        return null;
    }

    private int getDayBit(DayOfWeek day) {
        return switch (day) {
            case MONDAY    -> 1;
            case TUESDAY   -> 2;
            case WEDNESDAY -> 4;
            case THURSDAY  -> 8;
            case FRIDAY    -> 16;
            case SATURDAY  -> 32;
            case SUNDAY    -> 64;
        };
    }

    private boolean resolveCompletion(Habit habit, HabitLogDto.LogRequest request) {
        return switch (habit.getHabitType()) {
            case BOOLEAN -> request.completed();
            case QUANTITATIVE -> {
                if (request.value() != null && habit.getTargetValue() != null) {
                    yield request.value() >= habit.getTargetValue();
                }
                yield request.completed();
            }
        };
    }

    private void validate(HabitDto.CreateRequest request){
        if(request.habitType() == HabitType.QUANTITATIVE && request.targetValue() == null){
            throw new BadRequestException("Target Value is required for quantitative habits");
        }
        if((request.frequencyType() == FrequencyType.WEEKLY || 
                request.frequencyType() == FrequencyType.CUSTOM_DAYS && request.customDayMask() == null)
        ){
            throw new BadRequestException("customDaysMask is required for the weekly habits");
        }
    }

    private Habit findOwnedHabit(UUID id, User user){
        return habitRepository.findByIdAndUserAndDeletedAtNull(id, user).orElseThrow(
            () -> new ResourceNotFoundException("Habit not found")
        );
    }

    private record StreakResult(int current, int longest) {}
}
