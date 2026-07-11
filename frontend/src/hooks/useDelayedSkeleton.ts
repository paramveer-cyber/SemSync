import { useEffect, useRef, useState } from 'react';

export function useDelayedSkeleton(loading: boolean, delay = 150): boolean {
    const [show, setShow] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (loading) {
            timerRef.current = setTimeout(() => setShow(true), delay);
        } else {
            if (timerRef.current) clearTimeout(timerRef.current);
            setShow(false);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [loading, delay]);

    return show;
}
