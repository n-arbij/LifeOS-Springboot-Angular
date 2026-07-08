package com.barak.lifeOS.habit;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/habits")
public class HabitController {
    private final HabitService habitService;

    @GetMapping
    public ResponseEntity<Page<HabitDto.Response>> getAll(
        @PageableDefault(size = 10, sort = "name") Pageable pageable
    ){
        return ResponseEntity.ok(habitService.getAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HabitDto.Response> getById(@PathVariable UUID id){
        return ResponseEntity.ok(habitService.getById(id));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<HabitLogDto.Response>> log(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ){
        return ResponseEntity.ok(habitService.getLogsForDate(date));
    }

    @GetMapping("/{id}/week-summary")
    public ResponseEntity<HabitLogDto.WeekSummary> getWeekSummary(
        @PathVariable UUID id,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ){
        return ResponseEntity.ok(habitService.getWeekSummary(id, date));
    }

    @PostMapping
    public ResponseEntity<HabitDto.Response> create(@Valid @RequestBody HabitDto.CreateRequest request){
        return ResponseEntity.status(HttpStatus.CREATED).body(habitService.createHabit(request));
    }

    @PostMapping("/{id}/logs")
    public ResponseEntity<HabitLogDto.Response> log(
        @PathVariable UUID id,
        @Valid @RequestBody HabitLogDto.LogRequest request
    ){
        return ResponseEntity.ok(habitService.log(id, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HabitDto.Response> update(
        @PathVariable UUID id,
        @Valid @RequestBody HabitDto.UpdateRequest request
    ){
        return ResponseEntity.ok(habitService.updateHabit(id, request));
    }

    @PutMapping("/{id}/remove")
    public ResponseEntity<HabitDto.Response> delete(@PathVariable UUID id){
        habitService.deleteHabit(id);
        return ResponseEntity.noContent().build();
    }
}
