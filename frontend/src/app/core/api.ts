import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export interface StudentOption {
  id: number;
  name: string;
}
export interface Dashboard {
  school: { id: number; name: string; logoUrl: string };
  student: { id: number; name: string; className: string; avatarUrl: string };
  fee: { annualFee: number; currency: string; interestRate: number };
  activated: boolean;
}
export interface ActivationRequest {
  phone: string;
  pan: string;
  nameAsOnPan: string;
  email: string;
}
export interface ActivationResponse {
  studentId: number;
  activated: boolean;
  submittedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AssessmentApi {
  private readonly http = inject(HttpClient);
  students() {
    return this.http.get<StudentOption[]>('/api/v1/students');
  }
  dashboard(id: number) {
    return this.http.get<Dashboard>(`/api/v1/students/${id}/dashboard`);
  }
  activate(id: number, request: ActivationRequest) {
    return this.http.put<ActivationResponse>(`/api/v1/students/${id}/activation`, request);
  }
}
