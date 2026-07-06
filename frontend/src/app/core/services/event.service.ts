import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { CreateEventRequest, EventResponse, EventSummaryResponse, UpdateEventRequest } from "../models/event.model";

@Injectable({providedIn: 'root'})
export class EventService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/events`;

    getAll(month: string): Observable<EventSummaryResponse[]> {
        const params = new HttpParams().set('month', month);
        return this.http.get<EventSummaryResponse[]>(this.API, {params});
    }

    getById(id: string): Observable<EventResponse> {
        return this.http.get<EventResponse>(`${this.API}/${id}`);
    }

    create(request: CreateEventRequest): Observable<EventResponse> {
    return this.http.post<EventResponse>(this.API, request);
  }

    update(id: string, request: UpdateEventRequest): Observable<EventResponse> {
        return this.http.put<EventResponse>(`${this.API}/${id}`, request);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.API}/${id}`);
    }
}