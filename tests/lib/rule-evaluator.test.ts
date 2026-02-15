import { describe, it, expect } from 'vitest';
import { evaluateFieldConditions } from '@lib/rule-evaluator';
import { FieldConditions } from '@lib/schema-types';

describe('evaluateFieldConditions', () => {
    it('evaluates legacy array conditions as implicit AND', () => {
        const conditions: FieldConditions = [
            { field: 'role', operator: 'eq', value: 'admin' },
            { field: 'country', operator: 'eq', value: 'US' },
        ];

        expect(evaluateFieldConditions(conditions, { role: 'admin', country: 'US' })).toBe(true);
        expect(evaluateFieldConditions(conditions, { role: 'admin', country: 'CA' })).toBe(false);
    });

    it('evaluates nested any/all rule groups', () => {
        const conditions: FieldConditions = {
            all: [
                { field: 'isLoggedIn', operator: 'eq', value: true },
                {
                    any: [
                        { field: 'role', operator: 'eq', value: 'admin' },
                        { field: 'role', operator: 'eq', value: 'support' },
                    ],
                },
            ],
        };

        expect(evaluateFieldConditions(conditions, { isLoggedIn: true, role: 'admin' })).toBe(true);
        expect(evaluateFieldConditions(conditions, { isLoggedIn: true, role: 'support' })).toBe(true);
        expect(evaluateFieldConditions(conditions, { isLoggedIn: true, role: 'user' })).toBe(false);
    });

    it('evaluates not rule groups', () => {
        const conditions: FieldConditions = {
            not: { field: 'status', operator: 'eq', value: 'archived' },
        };

        expect(evaluateFieldConditions(conditions, { status: 'active' })).toBe(true);
        expect(evaluateFieldConditions(conditions, { status: 'archived' })).toBe(false);
    });
});
