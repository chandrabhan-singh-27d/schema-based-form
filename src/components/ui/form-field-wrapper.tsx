import React from 'react';
import { FieldError } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface FormFieldWrapperProps {
    label: string;
    error?: FieldError;
    description?: string;
    required?: boolean;
    className?: string;
    children: React.ReactNode;
    id: string;
}

/**
 * Shared wrapper that renders label, helper text, and inline validation state.
 */
export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
    label,
    error,
    description,
    required,
    className,
    children,
    id,
}) => {
    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <label
                htmlFor={id}
                id={`${id}-label`}
                className="text-sm font-semibold leading-none text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {children}

            {description && !error && (
                <p className="text-sm text-gray-600">{description}</p>
            )}

            {error && (
                <p id={`${id}-error`} role="alert" className="text-sm font-medium text-red-500">{error.message}</p>
            )}
        </div>
    );
};
