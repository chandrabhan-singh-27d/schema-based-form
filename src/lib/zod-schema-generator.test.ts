import { describe, it, expect } from 'vitest';
import { generateZodSchema } from './zod-schema-generator';
import { FieldSchema } from './schema-types';

describe('generateZodSchema', () => {
    it('should generate a simple schema for text field', () => {
        const fields: FieldSchema[] = [
            { id: 'name', type: 'text', label: 'Name', validation: { required: true } }
        ];
        const schema = generateZodSchema(fields);

        expect(schema.safeParse({ name: 'John' }).success).toBe(true);
        expect(schema.safeParse({ name: '' }).success).toBe(false);
    });

    it('should handle optional fields', () => {
        const fields: FieldSchema[] = [
            { id: 'optional', type: 'text', label: 'Optional' }
        ];
        const schema = generateZodSchema(fields);

        expect(schema.safeParse({}).success).toBe(true);
        expect(schema.safeParse({ optional: 'value' }).success).toBe(true);
    });

    it('should validate email fields', () => {
        const fields: FieldSchema[] = [
            { id: 'email', type: 'email', label: 'Email', validation: { required: true } }
        ];
        const schema = generateZodSchema(fields);

        expect(schema.safeParse({ email: 'test@example.com' }).success).toBe(true);
        expect(schema.safeParse({ email: 'invalid-email' }).success).toBe(false);
    });

    it('should validate number fields with min/max', () => {
        const fields: FieldSchema[] = [
            { id: 'age', type: 'number', label: 'Age', validation: { min: 18, max: 100 } }
        ];
        const schema = generateZodSchema(fields);

        expect(schema.safeParse({ age: 20 }).success).toBe(true);
        expect(schema.safeParse({ age: 10 }).success).toBe(false); // < 18
        expect(schema.safeParse({ age: 150 }).success).toBe(false); // > 100
    });

    it('should handle conditional fields (simple equality)', () => {
        const fields: FieldSchema[] = [
            { id: 'country', type: 'select', label: 'Country', options: [{ label: 'US', value: 'US' }, { label: 'CA', value: 'CA' }] },
            {
                id: 'state',
                type: 'text',
                label: 'State',
                conditions: [{ field: 'country', operator: 'eq', value: 'US' }],
                validation: { required: true }
            }
        ];
        const schema = generateZodSchema(fields);

        // Country is US, State is required
        expect(schema.safeParse({ country: 'US', state: 'NY' }).success).toBe(true);
        expect(schema.safeParse({ country: 'US' }).success).toBe(false);

        // Country is CA, State is hidden/not required
        expect(schema.safeParse({ country: 'CA' }).success).toBe(true);
    });

    it('should reject select values not present in options', () => {
        const fields: FieldSchema[] = [
            {
                id: 'role',
                type: 'select',
                label: 'Role',
                options: [{ label: 'User', value: 'user' }, { label: 'Admin', value: 'admin' }],
                validation: { required: true },
            },
        ];
        const schema = generateZodSchema(fields);

        expect(schema.safeParse({ role: 'admin' }).success).toBe(true);
        expect(schema.safeParse({ role: 'hacker' }).success).toBe(false);
    });

    it('should evaluate numeric conditional rules with numeric data', () => {
        const fields: FieldSchema[] = [
            {
                id: 'level',
                type: 'select',
                label: 'Level',
                options: [{ label: 'One', value: 1 }, { label: 'Two', value: 2 }],
                validation: { required: true },
            },
            {
                id: 'code',
                type: 'text',
                label: 'Code',
                conditions: [{ field: 'level', operator: 'eq', value: 2 }],
                validation: { required: true },
            },
        ];
        const schema = generateZodSchema(fields);

        expect(schema.safeParse({ level: 2, code: 'XYZ' }).success).toBe(true);
        expect(schema.safeParse({ level: 2 }).success).toBe(false);
        expect(schema.safeParse({ level: 1 }).success).toBe(true);
    });
});
