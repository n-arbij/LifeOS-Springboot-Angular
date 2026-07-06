export type Mood = 'GREAT' | 'GOOD' | 'NEUTRAL' | 'BAD' | 'TERRIBLE';

export interface CreateJournalRequest{
    title: string;
    content: string;
    mood: Mood;
    entryDate?: string;
}

export interface UpdateJournalRequest{
    title?: string;
    content?: string;
    mood?: Mood;
}

export interface JournalResponse{
    id: string;
    title: string;
    content: string;
    mood: Mood;
    entryDate: string;
    createdAt: string;
    updateAt: string;
}

export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}