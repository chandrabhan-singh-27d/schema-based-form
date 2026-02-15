import React from 'react';
import { UseFormRegister, FieldValues, Path, FieldError } from 'react-hook-form';
import { FieldSchema } from '@/lib/schema-types';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { cn } from '@/lib/utils';

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
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    error ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300"
                )}
            />
        </FormFieldWrapper>
    );
};
