import { SubmissionRecord } from '@forms/domain/types';

export interface SubmissionRepository {
    list(): Promise<SubmissionRecord[]>;
    save(submission: SubmissionRecord): Promise<SubmissionRecord[]>;
    count(): Promise<number>;
}
