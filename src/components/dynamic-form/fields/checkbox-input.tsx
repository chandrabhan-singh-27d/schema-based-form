import React from 'react';
import { UseFormRegister, FieldValues, Path, FieldError } from 'react-hook-form';
import { FieldSchema } from '@/lib/schema-types';
import { cn } from '@/lib/utils';

interface CheckboxInputProps<T extends FieldValues> {
    field: FieldSchema;
    register: UseFormRegister<T>;
    error?: FieldError;
}

export const CheckboxInput = <T extends FieldValues>({ field, register, error }: CheckboxInputProps<T>) => {
    return (
        <div className={cn("flex flex-col gap-1.5", field.className)}>
            <div className="flex items-start space-x-2">
                <input
                    type="checkbox"
                    id={field.id}
                    {...register(field.id as Path<T>)}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${field.id}-error` : undefined}
                    className={cn(
                        "h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400",
                        error ? "border-red-500" : ""
                    )}
                />
                <div className="grid gap-1.5 leading-none">
                    <label
                        htmlFor={field.id}
                        className="text-sm font-medium leading-none text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        {field.label}
                        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.description && (
                        <p className="text-sm text-gray-600">{field.description}</p>
                    )}
                </div>
            </div>
            {error && (
                <p id={`${field.id}-error`} role="alert" className="text-sm font-medium text-red-500">{error.message}</p>
            )}
        </div>
    );
};
