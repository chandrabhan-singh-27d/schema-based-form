import { FieldError, FieldErrors, FieldValues } from 'react-hook-form';

/**
 * Walks nested React Hook Form error objects and returns the first user-facing message.
 */
export const getFirstErrorMessage = (errors: FieldErrors<FieldValues>): string | undefined => {
    const queue = Object.values(errors) as Array<FieldError | FieldErrors<FieldValues> | undefined>;

    while (queue.length > 0) {
        const entry = queue.shift();
        if (!entry) continue;

        if ('message' in entry && typeof entry.message === 'string') {
            return entry.message;
        }

        if (typeof entry === 'object') {
            queue.push(...(Object.values(entry) as Array<FieldError | FieldErrors<FieldValues> | undefined>));
        }
    }

    return undefined;
};
