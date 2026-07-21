import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { HabitLogResponse, HabitPayload, HabitResponse, HabitWeekSummary, LogHabitRequest} from "../models/habit.model";
import { Page } from "../models/journal-entry.model";

@Injectable({ providedIn: 'root' })
export class HabitService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/habits`;

  getAll(page = 0, size = 10): Observable<Page<HabitResponse>> {
    return this.http.get<Page<HabitResponse>>(this.API, {
      params: {page, size}
    });
  }

  getById(id: string): Observable<HabitResponse> {
    return this.http.get<HabitResponse>(`${this.API}/${id}`);
  }

  create(request: HabitPayload): Observable<HabitResponse> {
    return this.http.post<HabitResponse>(this.API, request);
  }

  update(id: string, request: HabitPayload): Observable<HabitResponse> {
    return this.http.put<HabitResponse>(`${this.API}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  log(habitId: string, request: LogHabitRequest): Observable<HabitLogResponse> {
    return this.http.post<HabitLogResponse>(`${this.API}/${habitId}/logs`, request);
  }

  getWeekSummary(habitId: string, date: string): Observable<HabitWeekSummary> {
    return this.http.get<HabitWeekSummary>(`${this.API}/${habitId}/week-summary`, {
      params: { date }
    });
  }
}