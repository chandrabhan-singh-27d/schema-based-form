import { describe, it, expect } from 'vitest';
import { normalizeFormSchema } from './normalize-form-schema';

describe('normalizeFormSchema', () => {
    it('parses valid form schema objects', () => {
        const schema = normalizeFormSchema({
            id: 'test-form',
            title: 'Test Form',
            fields: [
                {
                    id: 'name',
                    type: 'text',
                    label: 'Name',
                },
            ],
        });

        expect(schema.id).toBe('test-form');
        expect(schema.fields.length).toBe(1);
    });

    it('throws for invalid form schema objects', () => {
        expect(() => normalizeFormSchema({ id: 'bad' })).toThrow();
    });
});
