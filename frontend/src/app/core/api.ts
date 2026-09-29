import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export interface StudentOption { id: number; name: string; }
export interface Dashboard {
  school: { id: number; name: string; logoUrl: string };
  student: { id: number; name: string; className: string; avatarUrl: string };
  fee: { annualFee: number; currency: string; interestRate: number };
  activated: boolean;
}

@Injectable({ providedIn: 'root' })
export class AssessmentApi {
  private readonly http = inject(HttpClient);
  students() { return this.http.get<StudentOption[]>('/api/v1/students'); }
  dashboard(id: number) { return this.http.get<Dashboard>(`/api/v1/students/${id}/dashboard`); }
}
