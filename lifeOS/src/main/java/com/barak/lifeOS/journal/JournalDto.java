package com.barak.lifeOS.journal;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class JournalDto {

    public record CreateRequest(
        @NotBlank @Size(min = 5, max = 100) String title,
        @NotBlank String content,
        @NotNull Mood mood,
        LocalDate entryDate
    ) {}

    public record UpdateRequest(
        String title,
        String content,
        Mood mood
    ) {}

    public record Response(
        UUID id,
        String title,
        String content,
        Mood mood,
        LocalDate entryDate,
        Instant createdAt,
        Instant updatedAt
    ) {
        public static Response fromEntity(JournalEntry entry){
            return new Response(
                entry.getId(),
                entry.getTitle(),
                entry.getContent(),
                entry.getMood(),
                entry.getEntryDate(),
                entry.getCreatedAt(), 
                entry.getUpdatedAt()
            );
        }
    }
}
