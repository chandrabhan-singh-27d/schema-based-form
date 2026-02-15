import { z } from 'zod';
import { FormSchema } from '@/features/forms/domain/types';

const conditionalRuleSchema = z.object({
    field: z.string(),
    operator: z.enum(['eq', 'neq', 'in', 'nin']),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]),
});

type RuleNodeInput =
    | z.infer<typeof conditionalRuleSchema>
    | { all?: RuleNodeInput[]; any?: RuleNodeInput[]; not?: RuleNodeInput };

const ruleNodeSchema: z.ZodType<RuleNodeInput> = z.lazy(() =>
    z.union([
        conditionalRuleSchema,
        z.object({
            all: z.array(ruleNodeSchema).optional(),
            any: z.array(ruleNodeSchema).optional(),
            not: ruleNodeSchema.optional(),
        }),
    ])
);

const validationRuleSchema = z.object({
    required: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    custom: z.string().optional(),
    message: z.string().optional(),
}).optional();

const optionSchema = z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
});

const fieldSchema = z.object({
    id: z.string(),
    type: z.enum(['text', 'number', 'email', 'password', 'select', 'checkbox', 'radio', 'textarea']),
    label: z.string(),
    placeholder: z.string().optional(),
    defaultValue: z.unknown().optional(),
    options: z.array(optionSchema).optional(),
    validation: validationRuleSchema,
    conditions: z.union([z.array(conditionalRuleSchema), ruleNodeSchema]).optional(),
    description: z.string().optional(),
    className: z.string().optional(),
});

const formSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    successMessage: z.string().optional(),
    fields: z.array(fieldSchema),
});

/**
 * Validates and normalizes unknown data into a typed FormSchema.
 */
export const normalizeFormSchema = (rawSchema: unknown): FormSchema => {
    return formSchema.parse(rawSchema) as FormSchema;
};

/**
 * Validates a list of unknown schemas into typed FormSchema values.
 */
export const normalizeFormSchemas = (rawSchemas: unknown[]): FormSchema[] => {
    return rawSchemas.map((rawSchema) => normalizeFormSchema(rawSchema));
};
