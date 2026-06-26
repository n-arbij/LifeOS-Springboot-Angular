package com.barak.lifeOS.journal;

import java.time.LocalDate;
import java.util.UUID;

import com.barak.lifeOS.common.BaseEntity;
import com.barak.lifeOS.common.encryption.EncryptedStringConverter;
import com.barak.lifeOS.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
public class JournalEntry extends BaseEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column
    private String title;

    @Convert(converter = EncryptedStringConverter.class)
    @Column
    private String content;

    @Enumerated(EnumType.STRING)
    @Column
    private Mood mood;

    private LocalDate entryDate;
}