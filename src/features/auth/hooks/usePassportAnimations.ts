/**
 * usePassportAnimations
 *
 * Centraliza la lógica de animaciones del módulo Pasaporte:
 * - Contador animado para el Trust Score (smooth count-up).
 * - Genera clases de stagger delay para entrada de secciones.
 *
 * AGENTS.md §5.2 — Lógica de estado en hooks.
 * skill: frontend-design → "one well-orchestrated page load with staggered reveals"
 */
import { useEffect, useRef, useState } from 'react';

/**
 * useCountUp
 * Anima un número desde 0 hasta el target en `duration` ms.
 */
export const useCountUp = (
  target: number,
  duration: number = 1200,
  enabled: boolean = true
): number => {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    const animate = (now: number) => {
      if (!startTime.current) startTime.current = now;
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      }
    };

    startTime.current = 0;
    raf.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, enabled]);

  return value;
};

/**
 * useInView
 * Devuelve true cuando el elemento ref es visible en el viewport.
 * Útil para disparar animaciones on-scroll.
 */
export const useInView = (threshold: number = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // Solo se dispara una vez
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
};

/**
 * getStaggerClass
 * Devuelve una clase CSS de delay para animaciones escalonadas.
 * Requiere que las clases 'delay-[X]ms' estén whitelisteadas en Tailwind
 * o que se use el archivo de estilos globales para incluirlas.
 */
export const getStaggerDelay = (index: number, baseDelay = 80): string => {
  const delay = index * baseDelay;
  return `animation-delay-[${delay}ms]`;
};
