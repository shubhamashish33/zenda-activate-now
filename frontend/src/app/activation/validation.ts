import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivationRequest } from '../core/api';

export const EMAIL_PATTERN =
  /^[A-Za-z0-9_%+-]+(?:\.[A-Za-z0-9_%+-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+com$/i;
export const PHONE_PATTERN = /^\+91[0-9]{10}$/;
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function normalize(field: keyof ActivationRequest, value: string): string {
  const trimmed = value.trim();
  if (field === 'phone') return trimmed.replace(/[\s-]/g, '');
  if (field === 'pan') return trimmed.toUpperCase();
  return trimmed;
}

export function fieldValidator(field: keyof ActivationRequest): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = normalize(field, String(control.value ?? ''));
    if (!value) return { required: true };
    const valid =
      field === 'phone'
        ? PHONE_PATTERN.test(value)
        : field === 'pan'
          ? PAN_PATTERN.test(value)
          : field === 'email'
            ? EMAIL_PATTERN.test(value) && value.length <= 254
            : value.length <= 150;
    return valid ? null : { format: true };
  };
}
