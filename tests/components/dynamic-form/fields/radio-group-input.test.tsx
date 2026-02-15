import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RadioGroupInput } from '@components/dynamic-form/fields/radio-group-input';
import { FieldSchema } from '@lib/schema-types';

describe('RadioGroupInput', () => {
    const mockRegister = vi.fn().mockImplementation((name) => ({
        name,
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
    }));

    const defaultField: FieldSchema = {
        id: 'test-radio',
        type: 'radio',
        label: 'Role',
        options: [
            { label: 'Admin', value: 'admin' },
            { label: 'User', value: 'user' },
        ],
    };

    it('renders radio options', () => {
        render(<RadioGroupInput field={defaultField} register={mockRegister} />);

        expect(screen.getByText('Role')).toBeDefined();
        expect(screen.getAllByRole('radio')).toHaveLength(2);
        expect(screen.getByRole('radiogroup')).toBeDefined();
        expect(screen.getByRole('radiogroup').getAttribute('aria-labelledby')).toBe('test-radio-label');
    });

    it('shows error message', () => {
        const error = { type: 'required', message: 'Role is required' };
        render(<RadioGroupInput field={defaultField} register={mockRegister} error={error} />);

        expect(screen.getByText('Role is required')).toBeDefined();
    });

    it('coerces matching numeric option values', () => {
        const numericField: FieldSchema = {
            id: 'priority',
            type: 'radio',
            label: 'Priority',
            options: [{ label: 'High', value: 1 }, { label: 'Low', value: 2 }],
        };
        render(<RadioGroupInput field={numericField} register={mockRegister} />);
        const registerOptions = mockRegister.mock.calls.at(-1)?.[1];

        expect(registerOptions.setValueAs('1')).toBe(1);
    });
});
