import { z } from 'zod';
import { FieldSchema, ConditionalRule } from './schema-types';

/**
 * Generates a Zod schema for a single field based on its validation rules.
 * @param field The field schema definition.
 * @returns A Zod schema for the field.
 */
const generateFieldSchema = (field: FieldSchema) => {
    let schema: z.ZodTypeAny;

    switch (field.type) {
        case 'number':
            schema = z.number({ message: "Must be a number" });
            break;
        case 'checkbox':
            schema = z.boolean();
            break;
        case 'email':
            // start with string, email validation added later if needed or here
            schema = z.string().email({ message: "Invalid email address" });
            break;
        default:
            schema = z.string();
    }

    const { validation } = field;

    if (!validation) {
        if (field.type !== 'checkbox') {
            return schema.optional().or(z.literal(''));
        }
        return schema.optional();
    }

    // Apply refinements *before* making it optional
    if (validation.required) {
        if (field.type === 'text' || field.type === 'email' || field.type === 'password' || field.type === 'textarea' || field.type === 'select' || field.type === 'radio') {
            schema = (schema as z.ZodString).min(1, { message: validation.message || "Required" });
        }
    }

    if (validation.min !== undefined) {
        if (field.type === 'number') {
            schema = (schema as z.ZodNumber).min(validation.min, { message: validation.message || `Must be at least ${validation.min}` });
        }
    }

    if (validation.max !== undefined) {
        if (field.type === 'number') {
            schema = (schema as z.ZodNumber).max(validation.max, { message: validation.message || `Must be at most ${validation.max}` });
        }
    }

    if (validation.minLength !== undefined) {
        if (field.type === 'text' || field.type === 'password' || field.type === 'textarea' || field.type === 'email') {
            schema = (schema as z.ZodString).min(validation.minLength, { message: validation.message || `Must be at least ${validation.minLength} characters` });
        }
    }

    if (validation.maxLength !== undefined) {
        if (field.type === 'text' || field.type === 'password' || field.type === 'textarea' || field.type === 'email') {
            schema = (schema as z.ZodString).max(validation.maxLength, { message: validation.message || `Must be at most ${validation.maxLength} characters` });
        }
    }

    if (validation.pattern) {
        if (field.type === 'text' || field.type === 'password' || field.type === 'textarea' || field.type === 'email') {
            schema = (schema as z.ZodString).regex(new RegExp(validation.pattern), { message: validation.message || "Invalid format" });
        }
    }

    // Handle optionality last
    if (!validation.required) {
        if (field.type !== 'checkbox') {
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
                return Array.isArray(condition.value) && condition.value.includes(dependentValue);
            case 'nin':
                return Array.isArray(condition.value) && !condition.value.includes(dependentValue);
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
            // participating in conditional logic: allow anything initially
            // strict validation happens in superRefine
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
