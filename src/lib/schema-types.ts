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
    custom?: string; // For future custom validation logic names
    message?: string; // Custom error message
}

export type ConditionalOperator = 'eq' | 'neq' | 'in' | 'nin';

export interface ConditionalRule {
    field: string;
    operator: ConditionalOperator;
    value: string | number | boolean | (string | number)[];
}

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
    options?: Option[]; // For select, radio
    validation?: ValidationRule;
    conditions?: ConditionalRule[];
    description?: string;
    className?: string; // For custom styling overrides
}

export interface FormSchema {
    id: string;
    title: string;
    description?: string;
    successMessage?: string;
    fields: FieldSchema[];
}
