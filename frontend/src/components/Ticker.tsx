import Marquee from 'react-fast-marquee';

function Ticker({ items }: { items: string[] }) {
    return (
        <div
            className='border-y border-(--color-glass-border) py-3'
            style={{ background: 'var(--color-surface-1)' }}
        >
            <Marquee speed={50} gradient={false} pauseOnClick autoFill>
                {items.map((item, i) => (
                    <span
                        key={i}
                        className='flex items-center gap-3 text-3xs font-bold tracking-[0.3em] mr-12'
                        style={{ color: 'var(--color-text-faint)' }}
                    >
                        <span style={{ color: 'var(--color-brand)' }}>◆</span>
                        {item}
                    </span>
                ))}
            </Marquee>
        </div>
    );
}

export default Ticker;
