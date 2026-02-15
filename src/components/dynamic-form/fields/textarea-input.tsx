import React from 'react';
import { UseFormRegister, FieldValues, Path, FieldError } from 'react-hook-form';
import { FieldSchema } from '@/lib/schema-types';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { cn } from '@/lib/utils';

interface TextareaInputProps<T extends FieldValues> {
    field: FieldSchema;
    register: UseFormRegister<T>;
    error?: FieldError;
}

export const TextareaInput = <T extends FieldValues>({ field, register, error }: TextareaInputProps<T>) => {
    return (
        <FormFieldWrapper
            label={field.label}
            error={error}
            description={field.description}
            required={field.validation?.required}
            id={field.id}
            className={field.className}
        >
            <textarea
                id={field.id}
                placeholder={field.placeholder}
                {...register(field.id as Path<T>)}
                aria-invalid={!!error}
                aria-describedby={error ? `${field.id}-error` : undefined}
                className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    error ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300"
                )}
            />
        </FormFieldWrapper>
    );
};
