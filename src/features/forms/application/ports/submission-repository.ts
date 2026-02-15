import { SubmissionRecord } from '@/features/forms/domain/types';

export interface SubmissionRepository {
    list(): SubmissionRecord[];
    save(submission: SubmissionRecord): SubmissionRecord[];
    count(): number;
    subscribe(onChange: () => void): () => void;
}
