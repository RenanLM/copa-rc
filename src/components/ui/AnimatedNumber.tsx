import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';

/** Ids já animados nesta sessão: o contador "sobe" só na primeira vez que aparece. */
const alreadyAnimated = new Set<string>();

interface AnimatedNumberProps {
  value: number;
  /** Identifica o indicador. Com id, a contagem inicial acontece só uma vez por sessão. */
  id?: string;
  format?: (value: number) => string;
  duration?: number;
}

/**
 * Contador animado. Respeita movimento reduzido (mostra o valor final direto)
 * e expõe apenas o valor final a leitores de tela.
 */
export function AnimatedNumber({
  value,
  id,
  format = (n) => String(n),
  duration = 0.9,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef<number>(reduceMotion || (id && alreadyAnimated.has(id)) ? value : 0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduceMotion || shown.current === value) {
      shown.current = value;
      node.textContent = format(value);
      return;
    }
    if (id) alreadyAnimated.add(id);
    const controls = animate(shown.current, value, {
      duration,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (latest) => {
        shown.current = latest;
        node.textContent = format(Math.round(latest));
      },
    });
    return () => controls.stop();
    // `format` costuma ser uma função inline; apenas o valor dispara a animação.
  }, [value, id, duration, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className="num">
      <span ref={ref} aria-hidden="true">
        {format(Math.round(shown.current))}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
