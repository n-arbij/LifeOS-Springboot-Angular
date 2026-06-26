package com.barak.lifeOS.journal;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/journal-entries")
public class JournalController {
    private final JournalService journalService;

    @GetMapping
    public ResponseEntity<Page<JournalDto.Response>> getAll(
        @PageableDefault(size = 10, sort = "entryDate", direction = Sort.Direction.DESC) Pageable pageable
    ){
        return ResponseEntity.ok(journalService.getAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JournalDto.Response> getById(@PathVariable UUID id){
        return ResponseEntity.ok(journalService.getById(id));
    }

    @PostMapping("/create")
    public ResponseEntity<JournalDto.Response> create(@Valid @RequestBody JournalDto.CreateRequest request){
        return ResponseEntity.status(HttpStatus.CREATED).body(journalService.createJournal(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JournalDto.Response> update(@PathVariable UUID id, @Valid @RequestBody JournalDto.UpdateRequest request){
        return ResponseEntity.ok(journalService.updateJournal(id, request));
    }

    @PutMapping("/{id}/remove")
    public ResponseEntity<JournalDto.Response> delete(@PathVariable UUID id){
        journalService.deleteJournal(id);
        return ResponseEntity.noContent().build();
    }
}
