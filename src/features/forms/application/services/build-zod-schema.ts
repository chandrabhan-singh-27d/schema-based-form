import { z } from 'zod';
import { FieldSchema } from '@/features/forms/domain/types';
import { evaluateFieldConditions } from '@/features/forms/domain/rules/evaluate-field-conditions';

const STRING_FIELD_TYPES = new Set(['text', 'email', 'password', 'textarea']);
const DEFAULT_REQUIRED_MESSAGE = 'Please fill out this field.';

const buildOptionsSchema = (field: FieldSchema): z.ZodTypeAny => {
    const optionValues = field.options?.map((option) => option.value) ?? [];

    if (optionValues.length === 0) {
        return z.unknown();
    }

    return z.custom<string | number | undefined>(
        (value) => value === undefined || optionValues.some((optionValue) => optionValue === value),
        { message: field.validation?.message || 'Please choose one of the available options.' }
    );
};

const buildFieldSchema = (field: FieldSchema) => {
    const validation = field.validation;
    const requiredMessage = validation?.message || DEFAULT_REQUIRED_MESSAGE;
    let schema: z.ZodTypeAny;

    switch (field.type) {
        case 'number':
            schema = z.number({ message: validation?.message || 'Please enter a valid number.' });
            break;
        case 'checkbox':
            schema = z.boolean();
            break;
        case 'email':
            schema = z.string({ message: requiredMessage }).email({ message: validation?.message || 'Please enter a valid email address.' });
            break;
        case 'select':
        case 'radio':
            schema = buildOptionsSchema(field);
            break;
        default:
            schema = z.string({ message: requiredMessage });
    }

    if (!validation) {
        if (STRING_FIELD_TYPES.has(field.type)) {
            return schema.optional().or(z.literal(''));
        }
        return schema.optional();
    }

    if (validation.required && field.type === 'checkbox') {
        schema = z.literal(true, { message: validation.message || DEFAULT_REQUIRED_MESSAGE });
    }

    if (validation.required && field.type === 'number') {
        schema = z.number({ message: validation.message || DEFAULT_REQUIRED_MESSAGE });
    }

    if (validation.required && STRING_FIELD_TYPES.has(field.type)) {
        schema = (schema as z.ZodString).min(1, { message: validation.message || DEFAULT_REQUIRED_MESSAGE });
    }

    if (validation.required && (field.type === 'select' || field.type === 'radio')) {
        schema = schema.refine(
            (value) => value !== undefined && value !== null && value !== '',
            { message: validation.message || DEFAULT_REQUIRED_MESSAGE }
        );
    }

    if (validation.min !== undefined && field.type === 'number') {
        schema = (schema as z.ZodNumber).min(validation.min, { message: validation.message || `Must be at least ${validation.min}` });
    }

    if (validation.max !== undefined && field.type === 'number') {
        schema = (schema as z.ZodNumber).max(validation.max, { message: validation.message || `Must be at most ${validation.max}` });
    }

    if (validation.minLength !== undefined && STRING_FIELD_TYPES.has(field.type)) {
        schema = (schema as z.ZodString).min(validation.minLength, { message: validation.message || `Must be at least ${validation.minLength} characters` });
    }

    if (validation.maxLength !== undefined && STRING_FIELD_TYPES.has(field.type)) {
        schema = (schema as z.ZodString).max(validation.maxLength, { message: validation.message || `Must be at most ${validation.maxLength} characters` });
    }

    if (validation.pattern && STRING_FIELD_TYPES.has(field.type)) {
        schema = (schema as z.ZodString).regex(new RegExp(validation.pattern), { message: validation.message || 'Invalid format' });
    }

    if (!validation.required) {
        if (STRING_FIELD_TYPES.has(field.type)) {
            schema = schema.optional().or(z.literal(''));
        } else {
            schema = schema.optional();
        }
    }

    return schema;
};

/**
 * Generates a form-level Zod schema from field definitions.
 */
export const buildZodSchema = (fields: FieldSchema[]) => {
    const shape: Record<string, z.ZodTypeAny> = {};
    const conditionalFields: FieldSchema[] = [];

    fields.forEach((field) => {
        if (field.conditions) {
            shape[field.id] = z.unknown();
            conditionalFields.push(field);
        } else {
            shape[field.id] = buildFieldSchema(field);
        }
    });

    const schema = z.object(shape);

    if (conditionalFields.length > 0) {
        return schema.superRefine((data, ctx) => {
            const formData = data as Record<string, unknown>;

            conditionalFields.forEach((field) => {
                const shouldShow = evaluateFieldConditions(field.conditions, formData);

                if (shouldShow) {
                    const fieldSchema = buildFieldSchema(field);
                    const result = fieldSchema.safeParse(formData[field.id]);

                    if (!result.success) {
                        result.error.issues.forEach((issue) => {
                            ctx.addIssue({
                                ...issue,
                                path: [field.id, ...issue.path],
                            });
                        });
                    }
                }
            });
        });
    }

    return schema;
};
