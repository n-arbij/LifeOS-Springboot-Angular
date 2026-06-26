package com.barak.lifeOS.journal;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.barak.lifeOS.common.Helper;
import com.barak.lifeOS.exception.ForbiddenException;
import com.barak.lifeOS.exception.ResourceNotFoundException;
import com.barak.lifeOS.user.User;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JournalService {
    private final JournalRepository repository;
    private final Helper helper;

    public Page<JournalDto.Response> getAll(Pageable pageable){
        User user = helper.getCurrentUser();
        return repository.findAllByUserAndDeletedAtNull(user, pageable)
                    .map(JournalDto.Response::fromEntity);
    }

    public JournalDto.Response getById(UUID id){
        JournalEntry entry = getJournalById(id);
        return JournalDto.Response.fromEntity(entry);
    }

    @Transactional
    public JournalDto.Response createJournal(JournalDto.CreateRequest request){
        User user = helper.getCurrentUser();
        JournalEntry entry = new JournalEntry();
        entry.setTitle(request.title());
        entry.setContent(request.content());
        entry.setMood(request.mood());
        entry.setEntryDate(request.entryDate() != null ? request.entryDate() : LocalDate.now());
        entry.setUser(user);
        repository.save(entry);

        return JournalDto.Response.fromEntity(entry);
    }

    @Transactional
    public JournalDto.Response updateJournal(UUID id, JournalDto.UpdateRequest request){
        JournalEntry entry = getJournalById(id);

        if(request.title() != null) entry.setTitle(request.title());
        if(request.content() != null) entry.setContent(request.content());
        if(request.mood() != null) entry.setMood(request.mood());
        entry.setUpdatedAt(Instant.now());

        return JournalDto.Response.fromEntity(entry);
    }

    @Transactional
    public JournalDto.Response deleteJournal(UUID id){
        JournalEntry entry = getJournalById(id);
        entry.setDeletedAt(Instant.now());
        repository.save(entry);

        return JournalDto.Response.fromEntity(entry);
    }

    private JournalEntry getJournalById(UUID id){
        User user = helper.getCurrentUser();
        JournalEntry entry = repository.findById(id).orElseThrow(
            () -> new ResourceNotFoundException("Journal Entry not found")
        );

        if(!entry.getUser().getId().equals(user.getId())){
            throw new ForbiddenException("Access to the Journal Entry denied");  
        }

        if (entry.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Journal Entry not found");
        } 
            
        return entry;
    }
}