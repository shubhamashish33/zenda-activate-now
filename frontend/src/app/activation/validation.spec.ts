import { FormControl } from '@angular/forms';
import { fieldValidator, normalize } from './validation';

describe('Activation validation', () => {
  it.each(['+91987654321', '+9198765432101', '9876543210', '+91abcdefghij'])(
    'rejects invalid phone %s',
    (value) => {
      expect(new FormControl(value, fieldValidator('phone')).invalid).toBe(true);
    },
  );
  it.each([
    'parent@example.org',
    'parentexample.com',
    'parent@.com',
    'a..b@example.com',
    'parent@-example.com',
  ])('rejects invalid email %s', (value) => {
    expect(new FormControl(value, fieldValidator('email')).invalid).toBe(true);
  });
  it('normalizes formatted phones and lowercase PAN before validation', () => {
    expect(normalize('phone', ' +91 98765-43210 ')).toBe('+919876543210');
    expect(new FormControl('+91 98765-43210', fieldValidator('phone')).valid).toBe(true);
    expect(normalize('pan', ' abcde1234f ')).toBe('ABCDE1234F');
    expect(new FormControl('abcde1234f', fieldValidator('pan')).valid).toBe(true);
    expect(new FormControl('parent@example.COM', fieldValidator('email')).valid).toBe(true);
  });
  it('rejects blank names and malformed PANs', () => {
    expect(new FormControl('   ', fieldValidator('nameAsOnPan')).hasError('required')).toBe(true);
    expect(new FormControl('AB123', fieldValidator('pan')).invalid).toBe(true);
    expect(new FormControl('x'.repeat(151), fieldValidator('nameAsOnPan')).invalid).toBe(true);
  });
});
