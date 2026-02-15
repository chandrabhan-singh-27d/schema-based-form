import { describe, it, expect } from 'vitest';
import { generateZodSchema } from '@lib/zod-schema-generator';
import { formSchemas } from './index';

describe('formSchemas', () => {
    it('exports at least one schema', () => {
        expect(formSchemas.length).toBeGreaterThan(0);
    });

    it('has unique schema ids', () => {
        const ids = formSchemas.map((schema) => schema.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(ids.length);
    });

    it('has unique field ids within each schema', () => {
        formSchemas.forEach((schema) => {
            const fieldIds = schema.fields.map((field) => field.id);
            const uniqueFieldIds = new Set(fieldIds);

            expect(uniqueFieldIds.size).toBe(fieldIds.length);
        });
    });

    it('builds a zod schema for each form schema without errors', () => {
        formSchemas.forEach((schema) => {
            expect(() => generateZodSchema(schema.fields)).not.toThrow();
        });
    });

    it('includes a success message for each schema', () => {
        formSchemas.forEach((schema) => {
            expect(schema.successMessage).toBeTruthy();
        });
    });

    it('includes field-level validation messages when validation rules exist', () => {
        formSchemas.forEach((schema) => {
            schema.fields.forEach((field) => {
                if (field.validation) {
                    expect(field.validation.message).toBeTruthy();
                }
            });
        });
    });
});
