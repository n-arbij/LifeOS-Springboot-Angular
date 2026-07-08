import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { CreateSessionRequest, PomodoroResponse, PomodoroSummaryResponse, UpdateSessionRequest } from "../models/pomodoro.model";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class PomodoroService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/pomodoro`;

  start(request: CreateSessionRequest): Observable<PomodoroResponse> {
    return this.http.post<PomodoroResponse>(`${this.API}/start`, request);
  }

  update(id: string, request: UpdateSessionRequest): Observable<PomodoroResponse> {
    return this.http.patch<PomodoroResponse>(`${this.API}/${id}`, request);
  }

  getActive(): Observable<PomodoroResponse | null> {
    return this.http.get<PomodoroResponse | null>(`${this.API}/active`);
  }

  getSummary(date: string): Observable<PomodoroSummaryResponse> {
    return this.http.get<PomodoroSummaryResponse>(`${this.API}/summary`, {
      params: { date }
    });
  }
}