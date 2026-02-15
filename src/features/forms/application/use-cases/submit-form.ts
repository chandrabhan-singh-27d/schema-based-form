import { FieldValues } from 'react-hook-form';
import { Notifier } from '@forms/application/ports/notifier';
import { SubmissionRepository } from '@forms/application/ports/submission-repository';
import { FormSchema, SubmissionRecord } from '@forms/domain/types';

interface SubmitFormDeps {
    repository: SubmissionRepository;
    notifier: Notifier;
}

/**
 * Creates a submission handler use-case that persists form data and notifies the user.
 */
export const createSubmitFormUseCase = ({ repository, notifier }: SubmitFormDeps) => {
    return (schema: FormSchema, data: FieldValues) => {
        const submission: SubmissionRecord = {
            schemaId: schema.id,
            schemaTitle: schema.title,
            submittedAt: new Date().toISOString(),
            data: data as Record<string, unknown>,
        };

        try {
            repository.save(submission);
            notifier.success('Submitted successfully', schema.successMessage ?? 'Response saved in this session.');
        } catch {
            notifier.error(
                "Couldn't save your response",
                "Your submission went through, but we couldn't save it in this browser session."
            );
        }
    };
};
