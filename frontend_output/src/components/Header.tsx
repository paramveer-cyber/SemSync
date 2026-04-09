interface HeaderProps { title: string; subtitle?: string; }

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="flex items-center px-8 py-5 shrink-0"
      style={{ borderBottom: '1px solid var(--color-glass-border)', background: 'var(--color-surface-1)' }}>
      <div>
        {subtitle && <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>}
        <h2 className="text-xl font-bold font-headline" style={{ color: 'var(--color-text)' }}>{title}</h2>
      </div>
    </header>
  );
}
