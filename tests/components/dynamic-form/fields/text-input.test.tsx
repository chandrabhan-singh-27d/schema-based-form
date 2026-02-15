import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextInput } from '@components/dynamic-form/fields/text-input';
import { FieldSchema } from '@lib/schema-types';

describe('TextInput', () => {
    const mockRegister = vi.fn().mockImplementation((name) => ({
        name,
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
    }));

    const defaultField: FieldSchema = {
        id: 'test-text',
        type: 'text',
        label: 'Test Text Input',
        placeholder: 'Enter text here',
    };

    it('renders correctly with default props', () => {
        render(<TextInput field={defaultField} register={mockRegister} />);

        expect(screen.getByLabelText('Test Text Input')).toBeDefined();
        expect(screen.getByPlaceholderText('Enter text here')).toBeDefined();
        expect(screen.getByRole('textbox')).toBeDefined();
    });

    it('displays error message when error is provided', () => {
        const error = { type: 'required', message: 'Field is required' };
        render(<TextInput field={defaultField} register={mockRegister} error={error} />);

        expect(screen.getByText('Field is required')).toBeDefined();
        expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe('true');
    });

    it('applies validation required asterisk', () => {
        const requiredField: FieldSchema = {
            ...defaultField,
            validation: { required: true }
        };
        render(<TextInput field={requiredField} register={mockRegister} />);
        expect(screen.getByText('*')).toBeDefined();
    });

    it('sets input type correctly', () => {
        const passwordField: FieldSchema = {
            ...defaultField,
            type: 'password',
            id: 'test-password',
            label: 'Password'
        };
        render(<TextInput field={passwordField} register={mockRegister} />);
        // Password definition in helper usually sets type="password" on input
        // In text-input.tsx: type={field.type}
        expect(screen.getByLabelText('Password').getAttribute('type')).toBe('password');
    });
});
