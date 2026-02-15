import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SelectInput } from './select-input';
import { FieldSchema } from '@/lib/schema-types';

describe('SelectInput', () => {
    const mockRegister = vi.fn().mockImplementation((name) => ({
        name,
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
    }));

    const defaultField: FieldSchema = {
        id: 'test-select',
        type: 'select',
        label: 'Test Select Input',
        options: [
            { label: 'Option 1', value: 'opt1' },
            { label: 'Option 2', value: 'opt2' },
        ],
    };

    it('renders correctly with options', () => {
        render(<SelectInput field={defaultField} register={mockRegister} />);

        expect(screen.getByLabelText('Test Select Input')).toBeDefined();
        expect(screen.getByRole('combobox')).toBeDefined();
        expect(screen.getAllByRole('option')).toHaveLength(3); // +1 for placeholder
    });

    it('displays error message when error is provided', () => {
        const error = { type: 'required', message: 'Selection is required' };
        render(<SelectInput field={defaultField} register={mockRegister} error={error} />);

        expect(screen.getByText('Selection is required')).toBeDefined();
        expect(screen.getByRole('combobox').getAttribute('aria-invalid')).toBe('true');
    });

    it('renders placeholder option', () => {
        render(<SelectInput field={defaultField} register={mockRegister} />);
        const placeholder = screen.getByText('Select an option');
        expect(placeholder).toBeDefined();
    });
});
