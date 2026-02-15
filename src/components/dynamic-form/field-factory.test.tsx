import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FieldFactory } from './field-factory';
import { FieldSchema } from '@lib/schema-types';
import { UseFormReturn, FieldValues } from 'react-hook-form';

const createForm = (watchValues: Record<string, unknown> = {}, errors: Record<string, unknown> = {}) => ({
    register: vi.fn().mockImplementation((name) => ({
        name,
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
    })),
    formState: { errors },
    watch: vi.fn((name?: string) => (name ? watchValues[name] : watchValues)),
}) as unknown as UseFormReturn<FieldValues>;

describe('FieldFactory', () => {
    it('renders text input for text fields', () => {
        const field: FieldSchema = {
            id: 'firstName',
            type: 'text',
            label: 'First Name',
        };

        render(<FieldFactory field={field} form={createForm()} />);

        expect(screen.getByLabelText('First Name')).toBeDefined();
        expect(screen.getByRole('textbox')).toBeDefined();
    }, 10000);

    it('hides conditional field when condition is not met', () => {
        const field: FieldSchema = {
            id: 'adminCode',
            type: 'text',
            label: 'Admin Code',
            conditions: [{ field: 'role', operator: 'eq', value: 'admin' }],
        };

        const { container } = render(<FieldFactory field={field} form={createForm({ role: 'user' })} />);

        expect(container.firstChild).toBeNull();
    });

    it('renders conditional field when condition is met', () => {
        const field: FieldSchema = {
            id: 'adminCode',
            type: 'text',
            label: 'Admin Code',
            conditions: [{ field: 'role', operator: 'eq', value: 'admin' }],
        };

        render(<FieldFactory field={field} form={createForm({ role: 'admin' })} />);

        expect(screen.getByLabelText('Admin Code')).toBeDefined();
    });

    it('supports nested rule groups for conditional visibility', () => {
        const field: FieldSchema = {
            id: 'priorityQueue',
            type: 'text',
            label: 'Priority Queue',
            conditions: {
                all: [
                    { field: 'isLoggedIn', operator: 'eq', value: true },
                    {
                        any: [
                            { field: 'role', operator: 'eq', value: 'admin' },
                            { field: 'role', operator: 'eq', value: 'support' },
                        ],
                    },
                ],
            },
        };

        render(<FieldFactory field={field} form={createForm({ isLoggedIn: true, role: 'support' })} />);
        expect(screen.getByLabelText('Priority Queue')).toBeDefined();
    });
});
