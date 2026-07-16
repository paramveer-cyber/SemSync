import { useEffect } from 'react';

export function useDocumentTitle(
    pageTitle: string,
    useSemSync: boolean = true,
): void {
    useEffect(() => {
        document.title = useSemSync ? `${pageTitle} | SemSync` : `${pageTitle}`;
    }, [pageTitle]);
}
