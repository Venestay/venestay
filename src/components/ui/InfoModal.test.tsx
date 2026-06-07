import { describe, it, expect } from 'vitest';
import { CONTACT_CONFIG } from '@/shared/config/contact';

describe('InfoModal & Contact Config', () => {
  it('CONTACT_CONFIG no tiene valores vacíos en campos críticos', () => {
    expect(CONTACT_CONFIG.whatsapp.support.url).not.toBe('');
    expect(CONTACT_CONFIG.whatsapp.hostRegister.url).not.toBe('');
    expect(CONTACT_CONFIG.whatsapp.support.display).toContain('+58');
  });

  it('la política de cancelación muestra la fecha correcta', () => {
    expect(CONTACT_CONFIG.policy.effectiveDate).toBe('Julio 2025');
  });
});
