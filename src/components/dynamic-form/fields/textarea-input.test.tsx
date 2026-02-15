import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextareaInput } from './textarea-input';
import { FieldSchema } from '@/lib/schema-types';

describe('TextareaInput', () => {
    const mockRegister = vi.fn().mockImplementation((name) => ({
        name,
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
    }));

    const defaultField: FieldSchema = {
        id: 'test-textarea',
        type: 'textarea',
        label: 'Bio',
        placeholder: 'Tell us about yourself',
    };

    it('renders label and textarea', () => {
        render(<TextareaInput field={defaultField} register={mockRegister} />);

        expect(screen.getByLabelText('Bio')).toBeDefined();
        expect(screen.getByRole('textbox')).toBeDefined();
    });

    it('shows error state and message', () => {
        const error = { type: 'required', message: 'Bio is required' };
        render(<TextareaInput field={defaultField} register={mockRegister} error={error} />);

        expect(screen.getByText('Bio is required')).toBeDefined();
        expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe('true');
    });
});
