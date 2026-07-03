import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { CreateJournalRequest, JournalResponse, Page, UpdateJournalRequest } from "../models/journal-entry.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, tap } from "rxjs";

@Injectable({providedIn: 'root'})
export class JournalService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/journal-entries`;

    getEntries(page = 0, size = 10, sort = 'entryDate,desc'): Observable<Page<JournalResponse>>{
        const params = new HttpParams()
            .set('page', page)
            .set('size', size)
            .set('sort', sort)

        return this.http.get<Page<JournalResponse>>(this.API, {params})
    }

    getEntry(id: string): Observable<JournalResponse> {
        return this.http.get<JournalResponse>(`${this.API}/${id}`);
    }

    createEntry(request: CreateJournalRequest): Observable<JournalResponse> {
        return this.http.post<JournalResponse>(`${this.API}/create`, request)
    }

    updateEntry(id: string, request: UpdateJournalRequest): Observable<JournalResponse> {
        return this.http.put<JournalResponse>(`${this.API}/${id}`, request);
    }

    deleteEntry(id: string): Observable<void> {
        return this.http.put<void>(`${this.API}/${id}/remove`, {})
    }
}