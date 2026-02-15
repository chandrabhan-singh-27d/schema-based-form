import React from 'react';
import { UseFormReturn, FieldValues, FieldError } from 'react-hook-form';
import { FieldSchema } from '@lib/schema-types';
import { TextInput } from './fields/text-input';
import { SelectInput } from './fields/select-input';
import { CheckboxInput } from './fields/checkbox-input';
import { RadioGroupInput } from './fields/radio-group-input';
import { TextareaInput } from './fields/textarea-input';
import { evaluateFieldConditions } from '@forms/domain/rules/evaluate-field-conditions';

interface FieldFactoryProps<T extends FieldValues> {
    field: FieldSchema;
    form: UseFormReturn<T>;
}

export const FieldFactory = <T extends FieldValues>({ field, form }: FieldFactoryProps<T>) => {
    const { register, formState: { errors }, watch } = form;
    const error = errors[field.id];

    // Hide fields until all configured display conditions evaluate to true.
    if (field.conditions) {
        const formData = watch() as Record<string, unknown>;
        const shouldShow = evaluateFieldConditions(field.conditions, formData);

        if (!shouldShow) return null;
    }

    // Shared props passed to every concrete field component.
    const commonProps = {
        field,
        register,
        error: error as FieldError,
    };

    switch (field.type) {
        case 'text':
        case 'email':
        case 'password':
        case 'number':
            return <TextInput {...commonProps} />;
        case 'textarea':
            return <TextareaInput {...commonProps} />;
        case 'select':
            return <SelectInput {...commonProps} />;
        case 'checkbox':
            return <CheckboxInput {...commonProps} />;
        case 'radio':
            return <RadioGroupInput {...commonProps} />;
        default:
            return null;
    }
};
