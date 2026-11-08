import { useEffect, useRef, useState } from 'react';

/**
 * Informa quando o elemento aparece na tela pela primeira vez. Serve para iniciar
 * animações só quando a pessoa vai vê-las (senão a animação acontece fora da tela).
 * Sem suporte a IntersectionObserver, `supported` é falso e `visible` é verdadeiro.
 */
export function useVisibleOnce<T extends Element>(threshold = 0.4) {
  const ref = useRef<T>(null);
  const supported = typeof IntersectionObserver !== 'undefined';
  const [visible, setVisible] = useState(!supported);

  useEffect(() => {
    const node = ref.current;
    if (!supported || !node || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [supported, visible, threshold]);

  return { ref, visible, supported };
}
