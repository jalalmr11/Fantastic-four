import { useEffect, useRef, useState } from 'react';

// Shared IntersectionObserver instances per threshold for optimal performance
const observerPool = new Map();

function getSharedObserver(threshold) {
  let entry = observerPool.get(threshold);
  if (!entry) {
    const callbacks = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((change) => {
          if (change.isIntersecting) {
            const cb = callbacks.get(change.target);
            if (cb) {
              cb();
              callbacks.delete(change.target);
              observer.unobserve(change.target);
            }
          }
        });
      },
      { threshold }
    );
    entry = { observer, callbacks };
    observerPool.set(threshold, entry);
  }
  return entry;
}

export function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isVisible) return;

    const { observer, callbacks } = getSharedObserver(threshold);
    callbacks.set(el, () => setIsVisible(true));
    observer.observe(el);

    return () => {
      callbacks.delete(el);
      observer.unobserve(el);
    };
  }, [threshold, isVisible]);

  return [ref, isVisible];
}

export function useTilt(intensity = 15) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip on touch screens or users with reduced motion
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canHover || prefersReducedMotion) return;

    let rect = null;
    let rafId = null;

    const handleEnter = () => {
      rect = el.getBoundingClientRect();
    };

    const handleMove = (e) => {
      if (!rect) {
        rect = el.getBoundingClientRect();
      }

      if (rafId) return;

      const clientX = e.clientX;
      const clientY = e.clientY;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!rect) return;
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -intensity;
        const rotateY = ((x - centerX) / centerX) * intensity;

        el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
      });
    };

    const handleLeave = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      rect = null;
      el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };

    el.addEventListener('mouseenter', handleEnter, { passive: true });
    el.addEventListener('mousemove', handleMove, { passive: true });
    el.addEventListener('mouseleave', handleLeave, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener('mouseenter', handleEnter);
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [intensity]);

  return ref;
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage might be full or unavailable
    }
  }, [key, value]);

  return [value, setValue];
}

export function useParallax(speed = 0.3) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const viewH = window.innerHeight;
        const offset = (rect.top - viewH / 2) * speed;
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return ref;
}

export function useScrollProgress() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const viewH = window.innerHeight;
        const elH = rect.height;
        const raw = 1 - (rect.top / (viewH + elH));
        setProgress(Math.max(0, Math.min(1, raw)));
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return [ref, progress];
}

export function useMagneticButton(strength = 0.3) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    };

    const handleLeave = () => {
      el.style.transform = 'translate(0, 0)';
      el.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    };

    const handleEnter = () => {
      el.style.transition = 'transform 0.15s ease-out';
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    el.addEventListener('mouseenter', handleEnter);

    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
      el.removeEventListener('mouseenter', handleEnter);
    };
  }, [strength]);

  return ref;
}
