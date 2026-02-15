import { z } from 'zod';
import { FieldSchema, ConditionalRule } from './schema-types';

const STRING_FIELD_TYPES = new Set(['text', 'email', 'password', 'textarea']);

const buildOptionsSchema = (field: FieldSchema): z.ZodTypeAny => {
    const optionValues = field.options?.map((option) => option.value) ?? [];

    if (optionValues.length === 0) {
        return z.string();
    }

    if (optionValues.length === 1) {
        return z.literal(optionValues[0]);
    }

    const [first, second, ...rest] = optionValues;
    return z.union([
        z.literal(first),
        z.literal(second),
        ...rest.map((value) => z.literal(value)),
    ]);
};

/**
 * Generates a Zod schema for a single field based on its validation rules.
 * @param field The field schema definition.
 * @returns A Zod schema for the field.
 */
const generateFieldSchema = (field: FieldSchema) => {
    let schema: z.ZodTypeAny;

    switch (field.type) {
        case 'number':
            schema = z.number({ message: 'Must be a number' });
            break;
        case 'checkbox':
            schema = z.boolean();
            break;
        case 'email':
            schema = z.string().email({ message: 'Invalid email address' });
            break;
        case 'select':
        case 'radio':
            schema = buildOptionsSchema(field);
            break;
        default:
            schema = z.string();
    }

    const { validation } = field;

    if (!validation) {
        if (STRING_FIELD_TYPES.has(field.type)) {
            return schema.optional().or(z.literal(''));
        }
        return schema.optional();
    }

    if (validation.required && STRING_FIELD_TYPES.has(field.type)) {
        schema = (schema as z.ZodString).min(1, { message: validation.message || 'Required' });
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
 * Generates a complete Zod object schema for a form based on a list of fields.
 * @param fields Array of field schema definitions.
 * @returns A Zod object schema.
 */
const evaluateConditions = (conditions: ConditionalRule[], data: Record<string, unknown>): boolean => {
    return conditions.every((condition) => {
        const dependentValue = data[condition.field];

        switch (condition.operator) {
            case 'eq':
                return dependentValue === condition.value;
            case 'neq':
                return dependentValue !== condition.value;
            case 'in':
                return Array.isArray(condition.value)
                    ? condition.value.some((value) => value === dependentValue)
                    : false;
            case 'nin':
                return Array.isArray(condition.value)
                    ? !condition.value.some((value) => value === dependentValue)
                    : false;
            default:
                return true;
        }
    });
};

/**
 * Generates a complete Zod object schema for a form based on a list of fields.
 * @param fields Array of field schema definitions.
 * @returns A Zod object schema.
 */
export const generateZodSchema = (fields: FieldSchema[]) => {
    const shape: Record<string, z.ZodTypeAny> = {};
    const conditionalFields: FieldSchema[] = [];

    fields.forEach((field) => {
        if (field.conditions && field.conditions.length > 0) {
            shape[field.id] = z.unknown();
            conditionalFields.push(field);
        } else {
            shape[field.id] = generateFieldSchema(field);
        }
    });

    const schema = z.object(shape);

    if (conditionalFields.length > 0) {
        return schema.superRefine((data, ctx) => {
            const formData = data as Record<string, unknown>;

            conditionalFields.forEach((field) => {
                const shouldShow = evaluateConditions(field.conditions!, formData);

                if (shouldShow) {
                    const fieldSchema = generateFieldSchema(field);
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
