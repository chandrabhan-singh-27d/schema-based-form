import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormFieldWrapper } from '@components/ui/form-field-wrapper';
import { FieldError } from 'react-hook-form';

describe('FormFieldWrapper', () => {
    const defaultProps = {
        label: 'Test Label',
        id: 'test-id',
        children: <input id="test-id" />,
    };

    it('renders label and children', () => {
        render(<FormFieldWrapper {...defaultProps} />);
        expect(screen.getByText('Test Label')).toBeDefined();
        expect(screen.getByRole('textbox')).toBeDefined(); // input defaults to textbox role usually, or check by id
    });

    it('renders required asterisk when required is true', () => {
        render(<FormFieldWrapper {...defaultProps} required={true} />);
        expect(screen.getByText('*')).toBeDefined();
    });

    it('renders description when provided and no error', () => {
        render(<FormFieldWrapper {...defaultProps} description="Test description" />);
        expect(screen.getByText('Test description')).toBeDefined();
    });

    it('renders error message and hides description when error is present', () => {
        const error: FieldError = { type: 'required', message: 'Error message' };
        render(<FormFieldWrapper {...defaultProps} description="Test description" error={error} />);
        expect(screen.getByText('Error message')).toBeDefined();
        expect(screen.queryByText('Test description')).toBeNull();
    });

    it('applies custom className', () => {
        const { container } = render(<FormFieldWrapper {...defaultProps} className="custom-class" />);
        expect(container.firstChild).toBeDefined();
        expect((container.firstChild as Element).className).toContain('custom-class');
    });
});
