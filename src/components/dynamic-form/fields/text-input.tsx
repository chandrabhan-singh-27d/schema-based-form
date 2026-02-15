import React from 'react';
import { UseFormRegister, FieldValues, Path, FieldError } from 'react-hook-form';
import { FieldSchema } from '@lib/schema-types';
import { FormFieldWrapper } from '@components/ui/form-field-wrapper';
import { cn } from '@lib/utils';

interface TextInputProps<T extends FieldValues> {
    field: FieldSchema;
    register: UseFormRegister<T>;
    error?: FieldError;
}

export const TextInput = <T extends FieldValues>({ field, register, error }: TextInputProps<T>) => {
    const registerOptions = field.type === 'number'
        ? {
            setValueAs: (value: string) => (value === '' ? undefined : Number(value)),
        }
        : undefined;

    return (
        <FormFieldWrapper
            label={field.label}
            error={error}
            description={field.description}
            required={field.validation?.required}
            id={field.id}
            className={field.className}
        >
            <input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                {...register(field.id as Path<T>, registerOptions)}
                aria-invalid={!!error}
                aria-describedby={error ? `${field.id}-error` : undefined}
                className={cn(
                    "flex h-11 w-full rounded-md border bg-white px-3 py-2 text-base sm:text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
                    error ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300 focus-visible:ring-gray-400"
                )}
            />
        </FormFieldWrapper>
    );
};
