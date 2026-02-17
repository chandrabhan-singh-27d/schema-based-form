import { useEffect, useState } from 'react';
import { SubmissionRepository } from '@forms/application/ports/submission-repository';

/**
 * Fetches submission count from any async repository implementation.
 */
export const useSessionSubmissionCount = (repository: SubmissionRepository) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let isMounted = true;

        repository.count()
            .then((value) => {
                if (isMounted) {
                    setCount(value);
                }
            })
            .catch(() => {
                // Keep default count on failure.
            });

        return () => {
            isMounted = false;
        };
    }, [repository]);

    return count;
};
