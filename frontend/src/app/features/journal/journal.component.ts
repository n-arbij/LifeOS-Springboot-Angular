import { Component, inject, signal } from '@angular/core';
import { JournalService } from '../../core/services/journal.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateJournalRequest, JournalResponse, Mood, UpdateJournalRequest } from '../../core/models/journal-entry.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-journal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './journal.component.html',
  styleUrl: './journal.component.css',
})
export class JournalComponent {
    private journalService = inject(JournalService);
    private fb = inject(FormBuilder);

    entries = signal<JournalResponse[]>([]);
    selectedEntry = signal<JournalResponse | null>(null);
    loading = signal(false);
    saving = signal(false);

    moods: Mood[] = ['GREAT', 'GOOD', 'NEUTRAL', 'BAD', 'TERRIBLE'];

    journalForm = this.fb.group({

        title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
        content: ['', Validators.required],
        mood: ['NEUTRAL' as Mood, Validators.required]
    })

    ngOnInit(): void {
        this.loadEntries();
    }

    loadEntries(): void{
        this.loading.set(true);
        this.journalService.getEntries().subscribe({
            next: (page) => {
                this.entries.set(page.content);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    selectEntry(event: Event, id: string): void{
        event.preventDefault();
        this.journalService.getEntry(id).subscribe({
            next: (entry) => {
                this.selectedEntry.set(entry);
                this.journalForm.patchValue({
                    title: entry.title,
                    content: entry.content,
                    mood: entry.mood
                });
            }
        })
    }

    newEntry(): void{
        this.selectedEntry.set(null);
        this.journalForm.reset({title: '', content: '', mood: 'NEUTRAL'});
    }

    onSubmit(): void {
        if(this.journalForm.invalid) return;

        this.saving.set(true);
        const formValue = this.journalForm.getRawValue();
        const current = this.selectedEntry();

        if(current){
            const updateReq: UpdateJournalRequest = {
                title: formValue.title!,
                content: formValue.content!,
                mood: formValue.mood!
            };
            this.journalService.updateEntry(current.id, updateReq).subscribe({
                next: (updated) => {
                    this.selectedEntry.set(updated);
                    this.saving.set(false);
                    this.loadEntries();
                },
                error: () => this.saving.set(false)
            });
        } else {
            const createReq: CreateJournalRequest = {
                title: formValue.title!,
                content: formValue.content!,
                mood: formValue.mood!
            };
            this.journalService.createEntry(createReq).subscribe({
                next: (created) => {
                    this.selectedEntry.set(created);
                    this.saving.set(false);
                    this.loadEntries();
                },
                error: () => this.saving.set(false)
            });
        }
    }

    formatDate(dateStr: string): string{
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }
}
