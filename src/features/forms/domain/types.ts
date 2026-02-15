export type FieldType =
    | 'text'
    | 'number'
    | 'email'
    | 'password'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'textarea';

export interface ValidationRule {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: string; // Reserved hook for named custom validators.
    message?: string; // User-facing message used for this field's validation failures.
}

export type ConditionalOperator = 'eq' | 'neq' | 'in' | 'nin';

export interface ConditionalRule {
    field: string;
    operator: ConditionalOperator;
    value: string | number | boolean | (string | number)[];
}

export interface RuleGroup {
    all?: RuleNode[];
    any?: RuleNode[];
    not?: RuleNode;
}

export type RuleNode = ConditionalRule | RuleGroup;
export type FieldConditions = ConditionalRule[] | RuleNode;

export interface Option {
    label: string;
    value: string | number;
}

export interface FieldSchema {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    defaultValue?: unknown;
    options?: Option[]; // Allowed options for select/radio fields.
    validation?: ValidationRule;
    conditions?: FieldConditions;
    description?: string;
    className?: string; // Optional per-field style override.
}

export interface FormSchema {
    id: string;
    title: string;
    description?: string;
    successMessage?: string;
    fields: FieldSchema[];
}

export interface SubmissionRecord {
    schemaId: string;
    schemaTitle: string;
    submittedAt: string;
    data: Record<string, unknown>;
}
