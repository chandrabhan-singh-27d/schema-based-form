import { useSyncExternalStore } from 'react';
import { SubmissionRepository } from '@/features/forms/application/ports/submission-repository';

/**
 * Hydration-safe subscription to live session submission count.
 */
export const useSessionSubmissionCount = (repository: SubmissionRepository) => {
    return useSyncExternalStore(
        repository.subscribe,
        repository.count,
        () => 0
    );
};
