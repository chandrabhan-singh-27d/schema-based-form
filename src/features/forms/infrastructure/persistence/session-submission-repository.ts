import { SubmissionRepository } from '@forms/application/ports/submission-repository';
import { SubmissionRecord } from '@forms/domain/types';

const SESSION_STORAGE_KEY = 'dynamic-form:submissions';
const SESSION_SUBMISSIONS_UPDATED_EVENT = 'session-submissions-updated';
const MAX_SESSION_SUBMISSIONS = 30;

const canUseWindow = () => typeof window !== 'undefined';

const read = (): SubmissionRecord[] => {
    if (!canUseWindow()) {
        return [];
    }

    try {
        const rawSubmissions = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
        return rawSubmissions ? (JSON.parse(rawSubmissions) as SubmissionRecord[]) : [];
    } catch {
        return [];
    }
};

const write = (submissions: SubmissionRecord[]) => {
    if (!canUseWindow()) {
        return;
    }

    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(submissions));
    window.dispatchEvent(new Event(SESSION_SUBMISSIONS_UPDATED_EVENT));
};

export const sessionSubmissionRepository: SubmissionRepository = {
    list: () => read(),
    save: (submission) => {
        const nextSubmissions = [submission, ...read()].slice(0, MAX_SESSION_SUBMISSIONS);
        write(nextSubmissions);
        return nextSubmissions;
    },
    count: () => read().length,
    subscribe: (onChange) => {
        if (!canUseWindow()) {
            return () => {};
        }

        const handleChange = () => onChange();
        window.addEventListener('storage', handleChange);
        window.addEventListener(SESSION_SUBMISSIONS_UPDATED_EVENT, handleChange);

        return () => {
            window.removeEventListener('storage', handleChange);
            window.removeEventListener(SESSION_SUBMISSIONS_UPDATED_EVENT, handleChange);
        };
    },
};
