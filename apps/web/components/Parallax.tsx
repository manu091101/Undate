'use client';

import {
  Children,
  cloneElement,
  isValidElement,
  useRef,
  type ReactElement,
  type ReactNode,
} from 'react';

/**
 * Mouse-driven parallax stage. Each direct child moves at its own depth as the
 * pointer travels across the container, giving the photo collage a living,
 * 3D-ish feel. Set per-child depth with `data-depth` (0 = static, 1 = strong).
 * Falls back to no motion under prefers-reduced-motion / touch.
 */
export function Parallax({
  children,
  className = '',
  max = 26,
}: {
  children: ReactNode;
  className?: string;
  /** Max travel in px for a depth-1 child. */
  max?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.querySelectorAll<HTMLElement>('[data-depth]').forEach((node) => {
        const depth = parseFloat(node.dataset.depth || '0');
        const rot = (node.dataset.rot || '0deg');
        node.style.transform = `translate3d(${-px * max * depth}px, ${-py * max * depth}px, 0) rotate(${rot})`;
      });
    });
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>('[data-depth]').forEach((node) => {
      node.style.transform = `translate3d(0,0,0) rotate(${node.dataset.rot || '0deg'})`;
    });
  }

  // Give each child a smooth transition without overriding its positioning class.
  const decorated = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const el = child as ReactElement<{ style?: React.CSSProperties }>;
    return cloneElement(el, {
      style: {
        ...(el.props.style || {}),
        transition: 'transform 0.5s cubic-bezier(0.2,0,0,1)',
        willChange: 'transform',
      },
    });
  });

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`perspective ${className}`}>
      {decorated}
    </div>
  );
}
