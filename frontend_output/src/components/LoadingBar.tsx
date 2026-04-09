import { useEffect, useState } from 'react';

export function TopLoadingBar() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setW(30),  60);
    const t2 = setTimeout(() => setW(60),  350);
    const t3 = setTimeout(() => setW(80),  900);
    const t4 = setTimeout(() => setW(86), 1800);
    return () => [t1,t2,t3,t4].forEach(clearTimeout);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none">
      <div className="h-full transition-all ease-out" style={{
        width: `${w}%`,
        background: 'linear-gradient(90deg, var(--color-brand), var(--color-brand-dim))',
        transitionDuration: w === 30 ? '200ms' : '700ms',
        boxShadow: '0 0 8px var(--color-brand-glow)',
      }} />
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}
      style={{ background: 'var(--color-glass-border)' }}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer"
        style={{ background: 'linear-gradient(90deg,transparent,var(--color-text-faint),transparent)' }} />
    </div>
  );
}

export function PageSpinner({ message = 'Loading…' }: { message?: string }) {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-28 space-y-5">
      <div className="relative w-11 h-11">
        <div className="absolute inset-0 rounded-full" style={{ border: '2px solid var(--color-glass)' }} />
        <div className="absolute inset-0 rounded-full animate-spin"
          style={{ border: '2px solid transparent', borderTopColor: 'var(--color-brand)', animationDuration: '700ms' }} />
        <div className="absolute inset-[4px] rounded-full animate-spin"
          style={{ border: '2px solid transparent', borderTopColor: 'rgba(var(--color-brand-raw,34,197,94),0.35)', animationDuration: '1100ms', animationDirection: 'reverse' }} />
      </div>
      <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{message}{dots}</p>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-10 animate-pulse">
      <TopLoadingBar />
      <section>
        <Skeleton className="h-4 w-48 mb-5" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_,i) => (
            <div key={i} className="glass rounded-2xl p-5 space-y-3">
              <div className="flex justify-between"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-8" /></div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
      <section>
        <div className="flex justify-between mb-5"><Skeleton className="h-4 w-36" /><Skeleton className="h-8 w-28 rounded-lg" /></div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => (
            <div key={i} className="glass rounded-2xl p-6 space-y-4">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-6 w-3/4 mt-4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}