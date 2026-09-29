import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, OnDestroy, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ActivationRequest, ActivationResponse, AssessmentApi } from '../core/api';
import { fieldValidator, normalize } from './validation';

type Field = keyof ActivationRequest;

@Component({
  selector: 'app-activation',
  imports: [ReactiveFormsModule],
  templateUrl: './activation.html',
  styleUrl: './activation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivationComponent implements AfterViewInit, OnDestroy {
  readonly studentId = input.required<number>();
  readonly cancelled = output<void>();
  readonly activated = output<ActivationResponse>();
  readonly busy = signal(false);
  readonly message = signal('');
  readonly serverErrors = signal<Partial<Record<Field, string>>>({});
  readonly fields: { key: Field; label: string; type: string; placeholder: string; autocomplete: string; maxLength: number }[] = [
    { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+91 9876543210', autocomplete: 'tel', maxLength: 20 },
    { key: 'pan', label: 'PAN Card Number', type: 'text', placeholder: 'ABCDE1234F', autocomplete: 'off', maxLength: 10 },
    { key: 'nameAsOnPan', label: 'Name as in PAN Card', type: 'text', placeholder: 'Name as on your PAN card', autocomplete: 'name', maxLength: 150 },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autocomplete: 'email', maxLength: 254 },
  ];
  readonly form = new FormGroup({
    phone: new FormControl('', { nonNullable: true, validators: [fieldValidator('phone')] }),
    pan: new FormControl('', { nonNullable: true, validators: [fieldValidator('pan')] }),
    nameAsOnPan: new FormControl('', { nonNullable: true, validators: [fieldValidator('nameAsOnPan')] }),
    email: new FormControl('', { nonNullable: true, validators: [fieldValidator('email')] }),
  });
  private readonly api = inject(AssessmentApi);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private previousOverflow = '';

  constructor() {
    for (const field of this.fields) {
      this.form.controls[field.key].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.serverErrors.update(errors => ({ ...errors, [field.key]: undefined }));
        this.message.set('');
      });
    }
  }
  ngAfterViewInit() {
    this.previousOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.dialog().nativeElement.showModal();
    this.dialog().nativeElement.querySelector<HTMLInputElement>('input')?.focus();
  }
  ngOnDestroy() { this.document.body.style.overflow = this.previousOverflow; }
  cancel(event?: Event) {
    event?.preventDefault();
    if (this.busy()) return;
    this.dialog().nativeElement.close();
    this.cancelled.emit();
  }
  blur(field: Field) {
    const control = this.form.controls[field];
    control.setValue(normalize(field, control.value));
    control.markAsTouched();
  }
  error(field: Field): string {
    const control = this.form.controls[field];
    if (this.serverErrors()[field]) return this.serverErrors()[field]!;
    if (!control.touched || !control.invalid) return '';
    if (control.hasError('required')) return 'This field is required.';
    return field === 'phone' ? 'Enter +91 followed by exactly 10 digits.'
      : field === 'email' ? 'Enter a valid email ending in .com.'
      : field === 'pan' ? 'Enter a valid PAN, for example ABCDE1234F.'
      : 'Use no more than 150 characters.';
  }
  valid(field: Field) {
    return this.form.controls[field].valid && !this.serverErrors()[field];
  }
  submit() {
    if (this.busy()) return;
    for (const field of this.fields) this.blur(field.key);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      const invalid = this.fields.find(field => this.form.controls[field.key].invalid);
      this.dialog().nativeElement.querySelector<HTMLInputElement>(`#${invalid?.key}`)?.focus();
      return;
    }
    this.busy.set(true); this.message.set(''); this.serverErrors.set({});
    this.api.activate(this.studentId(), this.form.getRawValue()).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false)),
    ).subscribe({
      next: response => { this.dialog().nativeElement.close(); this.activated.emit(response); },
      error: (error: HttpErrorResponse) => {
        if (error.status === 400 && error.error?.errors) this.serverErrors.set(error.error.errors);
        this.message.set(error.status === 0
          ? 'Connection lost. Your details are still here. Please try again.'
          : 'Unable to activate. Check your details and try again.');
      },
    });
  }
}
