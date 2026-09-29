import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, throwError } from 'rxjs';
import { ActivationResponse, AssessmentApi, Dashboard } from './core/api';
import { DashboardComponent } from './dashboard/dashboard';
import { ActivationComponent } from './activation/activation';

@Component({
  selector: 'app-root',
  imports: [DashboardComponent, ActivationComponent],
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
  readonly modalOpen = signal(false);
  readonly notice = signal('');
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.api
      .students()
      .pipe(
        switchMap((students) =>
          students.length
            ? this.api.dashboard(students[0].id)
            : throwError(() => new Error('No students')),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => {
          this.dashboard.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Unable to load your dashboard. Please try again.');
          this.loading.set(false);
        },
      });
  }
  activated(response: ActivationResponse) {
    this.modalOpen.set(false);
    // The successful response is authoritative persisted state, even if the subsequent refresh fails.
    this.dashboard.update((data) => (data ? { ...data, activated: response.activated } : data));
    this.notice.set('Your setup is complete. Monthly fee payments are now activated.');
    this.api
      .dashboard(response.studentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.dashboard.set(data),
        error: () =>
          this.notice.set('Activation saved. Refresh the dashboard to reload the latest details.'),
      });
  }
}
