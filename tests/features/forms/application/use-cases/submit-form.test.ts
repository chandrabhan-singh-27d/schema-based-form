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

    it('saves data and emits success notification', () => {
        const repository: SubmissionRepository = {
            list: vi.fn().mockReturnValue([]),
            save: vi.fn().mockReturnValue([]),
            count: vi.fn().mockReturnValue(0),
            subscribe: vi.fn().mockReturnValue(() => {}),
        };
        const notifier: Notifier = {
            success: vi.fn(),
            error: vi.fn(),
        };

        const submitForm = createSubmitFormUseCase({ repository, notifier });
        submitForm(schema, { email: 'a@b.com' });

        expect(repository.save).toHaveBeenCalledTimes(1);
        expect(notifier.success).toHaveBeenCalledWith('Submitted successfully', schema.successMessage);
        expect(notifier.error).not.toHaveBeenCalled();
    });

    it('emits error notification when repository save fails', () => {
        const repository: SubmissionRepository = {
            list: vi.fn().mockReturnValue([]),
            save: vi.fn(() => {
                throw new Error('boom');
            }),
            count: vi.fn().mockReturnValue(0),
            subscribe: vi.fn().mockReturnValue(() => {}),
        };
        const notifier: Notifier = {
            success: vi.fn(),
            error: vi.fn(),
        };

        const submitForm = createSubmitFormUseCase({ repository, notifier });
        submitForm(schema, { email: 'a@b.com' });

        expect(notifier.error).toHaveBeenCalledTimes(1);
    });
});
