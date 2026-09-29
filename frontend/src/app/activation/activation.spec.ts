import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivationComponent } from './activation';

describe('Activation submission', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.open = true; } });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.open = false; } });
    TestBed.configureTestingModule({ imports: [ActivationComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function setup() {
    const fixture = TestBed.createComponent(ActivationComponent);
    fixture.componentRef.setInput('studentId', 42); fixture.detectChanges();
    fixture.componentInstance.form.setValue({ phone: '+91 98765-43210', pan: 'abcde1234f', nameAsOnPan: ' DEMO PARENT ', email: 'parent@example.com' });
    return fixture;
  }
  it('normalizes the payload and prevents duplicate submissions while pending', () => {
    const fixture = setup(); const component = fixture.componentInstance;
    const saved = vi.fn(); component.activated.subscribe(saved);
    component.submit(); component.submit();
    const request = http.expectOne('/api/v1/students/42/activation');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ phone: '+919876543210', pan: 'ABCDE1234F', nameAsOnPan: 'DEMO PARENT', email: 'parent@example.com' });
    request.flush({ studentId: 42, activated: true, submittedAt: '2026-09-29T12:00:00' });
    expect(saved).toHaveBeenCalledOnce(); expect(component.busy()).toBe(false);
  });
  it('preserves details on failure and allows a retry', () => {
    const fixture = setup(); const component = fixture.componentInstance;
    component.submit();
    http.expectOne('/api/v1/students/42/activation').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(component.form.controls.email.value).toBe('parent@example.com');
    expect(component.message()).toContain('Unable to activate'); expect(component.busy()).toBe(false);
    component.submit();
    http.expectOne('/api/v1/students/42/activation').flush({ errors: { pan: 'Check PAN' } }, { status: 400, statusText: 'Bad Request' });
    expect(component.error('pan')).toBe('Check PAN');
    component.form.controls.pan.setValue('FGHIJ1234K'); expect(component.serverErrors().pan).toBeUndefined();
  });
  it('cancels without an API write and blocks cancellation during submission', () => {
    const fixture = setup(); const component = fixture.componentInstance;
    const cancelled = vi.fn(); component.cancelled.subscribe(cancelled);
    component.busy.set(true); component.cancel(); expect(cancelled).not.toHaveBeenCalled();
    component.busy.set(false); component.cancel(); expect(cancelled).toHaveBeenCalledOnce();
    http.expectNone('/api/v1/students/42/activation');
  });
});
