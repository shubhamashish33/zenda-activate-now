import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import './app.config';

describe('Dashboard API states', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('discovers the student and renders data from the dashboard API', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading');
    http.expectOne('/api/v1/students').flush([{ id: 42, name: 'API student' }]);
    http.expectOne('/api/v1/students/42/dashboard').flush({
      school: { id: 9, name: 'API school', logoUrl: '/logo.svg' },
      student: { id: 42, name: 'API student', className: 'Grade 1', avatarUrl: '/avatar.png' },
      fee: { annualFee: 123456, currency: 'INR', interestRate: 0 },
      activated: false,
    });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('API school');
    expect(fixture.nativeElement.textContent).toContain('API student');
    expect(fixture.nativeElement.textContent).toContain('1,23,456');
  });
  it('offers a retry after network failure', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('/api/v1/students').flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Unable');
    fixture.nativeElement.querySelector('button').click();
    http.expectOne('/api/v1/students').flush([]);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Retry');
  });
});
