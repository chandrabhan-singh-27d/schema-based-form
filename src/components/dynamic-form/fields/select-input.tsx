import React from 'react';
import { UseFormRegister, FieldValues, Path, FieldError } from 'react-hook-form';
import { FieldSchema } from '@/lib/schema-types';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { cn } from '@/lib/utils';

interface SelectInputProps<T extends FieldValues> {
    field: FieldSchema;
    register: UseFormRegister<T>;
    error?: FieldError;
}

export const SelectInput = <T extends FieldValues>({ field, register, error }: SelectInputProps<T>) => {
    const registerOptions = {
        setValueAs: (value: string) => {
            if (value === '') return undefined;
            const matchedOption = field.options?.find((option) => String(option.value) === value);
            return matchedOption ? matchedOption.value : value;
        },
    };

    return (
        <FormFieldWrapper
            label={field.label}
            error={error}
            description={field.description}
            required={field.validation?.required}
            id={field.id}
            className={field.className}
        >
            <select
                id={field.id}
                {...register(field.id as Path<T>, registerOptions)}
                aria-invalid={!!error}
                aria-describedby={error ? `${field.id}-error` : undefined}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    error ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300"
                )}
                defaultValue=""
            >
                <option value="" disabled className="text-gray-500">
                    {field.placeholder || "Select an option"}
                </option>
                {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </FormFieldWrapper>
    );
};
