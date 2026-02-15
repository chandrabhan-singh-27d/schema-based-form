import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckboxInput } from '@components/dynamic-form/fields/checkbox-input';
import { FieldSchema } from '@lib/schema-types';

describe('CheckboxInput', () => {
    const mockRegister = vi.fn().mockImplementation((name) => ({
        name,
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
    }));

    const defaultField: FieldSchema = {
        id: 'test-checkbox',
        type: 'checkbox',
        label: 'Test Checkbox',
    };

    it('renders correctly', () => {
        render(<CheckboxInput field={defaultField} register={mockRegister} />);

        expect(screen.getByLabelText('Test Checkbox')).toBeDefined();
        expect(screen.getByRole('checkbox')).toBeDefined();
    });

    it('displays error message when error is provided', () => {
        const error = { type: 'required', message: 'You must agree' };
        render(<CheckboxInput field={defaultField} register={mockRegister} error={error} />);

        expect(screen.getByText('You must agree')).toBeDefined();
        expect(screen.getByText('You must agree').getAttribute('id')).toBe('test-checkbox-error');
        expect(screen.getByRole('checkbox').getAttribute('aria-describedby')).toBe('test-checkbox-error');
    });

    it('applies validation required asterisk', () => {
        const requiredField: FieldSchema = {
            ...defaultField,
            validation: { required: true }
        };
        render(<CheckboxInput field={requiredField} register={mockRegister} />);
        expect(screen.getByText('*')).toBeDefined();
    });

    it('displays description', () => {
        const descField: FieldSchema = {
            ...defaultField,
            description: 'Check this box'
        };
        render(<CheckboxInput field={descField} register={mockRegister} />);
        expect(screen.getByText('Check this box')).toBeDefined();
    });
});
