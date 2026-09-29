import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, throwError } from 'rxjs';
import { AssessmentApi, Dashboard } from './core/api';
import { DashboardComponent } from './dashboard/dashboard';

@Component({
  selector: 'app-root',
  imports: [DashboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly api = inject(AssessmentApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly dashboard = signal<Dashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  constructor() { this.load(); }
  load() {
    this.loading.set(true); this.error.set('');
    this.api.students().pipe(
      switchMap(students => students.length ? this.api.dashboard(students[0].id) : throwError(() => new Error('No students'))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: data => { this.dashboard.set(data); this.loading.set(false); },
      error: () => { this.error.set('Unable to load your dashboard. Please try again.'); this.loading.set(false); },
    });
  }
}
