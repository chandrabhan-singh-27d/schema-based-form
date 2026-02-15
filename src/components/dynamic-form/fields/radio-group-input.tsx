import React from 'react';
import { UseFormRegister, FieldValues, Path, FieldError } from 'react-hook-form';
import { FieldSchema } from '@/lib/schema-types';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { cn } from '@/lib/utils';

interface RadioGroupInputProps<T extends FieldValues> {
    field: FieldSchema;
    register: UseFormRegister<T>;
    error?: FieldError;
}

export const RadioGroupInput = <T extends FieldValues>({ field, register, error }: RadioGroupInputProps<T>) => {
    const registerOptions = {
        setValueAs: (value: string) => {
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
            <div
                className={cn("grid gap-2", field.options && field.options.length > 2 ? "grid-cols-1" : "grid-cols-2")}
                role="radiogroup"
                aria-labelledby={`${field.id}-label`}
                aria-describedby={error ? `${field.id}-error` : undefined}
            >
                {field.options?.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                        <input
                            type="radio"
                            id={`${field.id}-${option.value}`}
                            value={option.value}
                            {...register(field.id as Path<T>, registerOptions)}
                            className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`${field.id}-${option.value}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {option.label}
                        </label>
                    </div>
                ))}
            </div>
        </FormFieldWrapper>
    );
};
