interface HeaderProps { title: string; subtitle?: string; }

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="flex items-center px-8 py-5 shrink-0"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div>
        {subtitle && <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{subtitle}</p>}
        <h2 className="text-xl font-bold text-white font-headline">{title}</h2>
      </div>
    </header>
  );
}