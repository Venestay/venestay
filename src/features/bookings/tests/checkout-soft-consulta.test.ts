import { describe, it, expect } from 'vitest';
import { getKYCConfig } from '@/features/auth/components/KYCRequiredModal';

describe('SPEC-CHECKOUT-SOFT-CONSULTA-001 — Lógica de Configuración y Retorno P2P', () => {
  it('devuelve el título cálido y el badge de borrador guardado cuando hasPendingBooking es true en estado UNVERIFIED', () => {
    const config = getKYCConfig('UNVERIFIED', true);

    expect(config.title).toBe('¡Casi listo para asegurar tu estadía! 🌴');
    expect(config.badge).toBe('🔒 Pago Pendiente Guardado');
    expect(config.ctaLabel).toBe('Completar en Mi Pasaporte y Continuar Pago');
    expect(config.canContinue).toBe(false);
  });

  it('devuelve el mensaje estándar cuando hasPendingBooking es false', () => {
    const config = getKYCConfig('UNVERIFIED', false);

    expect(config.title).toBe('Completa tu verificación para reservar');
    expect(config.badge).toBe('Verificación rápida');
    expect(config.ctaLabel).toBe('Completar verificación ahora');
  });

  it('permite continuar y avisa del borrador cuando el estado es PENDING_REVIEW', () => {
    const config = getKYCConfig('PENDING_REVIEW', true);

    expect(config.title).toBe('Tu verificación está en revisión');
    expect(config.description).toContain('tus fechas y borrador están guardados');
    expect(config.canContinue).toBe(true);
  });
});
