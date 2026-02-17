import { describe, it, expect, vi } from 'vitest';
import { createSubmitFormUseCase } from '@forms/application/use-cases/submit-form';
import { SubmissionRepository } from '@forms/application/ports/submission-repository';
import { Notifier } from '@forms/application/ports/notifier';
import { FormSchema } from '@forms/domain/types';

describe('createSubmitFormUseCase', () => {
    const schema: FormSchema = {
        id: 'contact',
        title: 'Contact Us',
        successMessage: 'Thanks! We will get back to you shortly.',
        fields: [],
    };

    it('saves data and emits success notification', async () => {
        const repository: SubmissionRepository = {
            list: vi.fn().mockResolvedValue([]),
            save: vi.fn().mockResolvedValue([]),
            count: vi.fn().mockResolvedValue(0),
        };
        const notifier: Notifier = {
            success: vi.fn(),
            error: vi.fn(),
        };

        const submitForm = createSubmitFormUseCase({ repository, notifier });
        await submitForm(schema, { email: 'a@b.com' });

        expect(repository.save).toHaveBeenCalledTimes(1);
        expect(notifier.success).toHaveBeenCalledWith('Submitted successfully', schema.successMessage);
        expect(notifier.error).not.toHaveBeenCalled();
    });

    it('emits error notification when repository save fails', async () => {
        const repository: SubmissionRepository = {
            list: vi.fn().mockResolvedValue([]),
            save: vi.fn().mockRejectedValue(new Error('boom')),
            count: vi.fn().mockResolvedValue(0),
        };
        const notifier: Notifier = {
            success: vi.fn(),
            error: vi.fn(),
        };

        const submitForm = createSubmitFormUseCase({ repository, notifier });
        await expect(submitForm(schema, { email: 'a@b.com' })).rejects.toThrow('Submission persistence failed.');

        expect(notifier.error).toHaveBeenCalledTimes(1);
    });
});
