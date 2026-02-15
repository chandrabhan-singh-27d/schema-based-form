import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DynamicForm } from './index';
import { FormSchema } from '@/lib/schema-types';

describe('DynamicForm', () => {
    const schema: FormSchema = {
        id: 'user-form',
        title: 'User Form',
        description: 'Fill out user details',
        fields: [
            {
                id: 'name',
                type: 'text',
                label: 'Name',
                validation: { required: true },
            },
            {
                id: 'age',
                type: 'number',
                label: 'Age',
                validation: { min: 18, required: true },
            },
        ],
    };

    it('submits valid form data', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<DynamicForm schema={schema} onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText(/Name/), 'John');
        await user.type(screen.getByLabelText(/Age/), '21');
        await user.click(screen.getByRole('button', { name: 'Submit' }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledTimes(1);
        });

        expect(onSubmit).toHaveBeenCalledWith({ name: 'John', age: 21 }, expect.anything());
    });

    it('blocks submit and shows validation message for invalid input', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<DynamicForm schema={schema} onSubmit={onSubmit} />);

        await user.click(screen.getByRole('button', { name: 'Submit' }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledTimes(0);
        });

        expect(screen.getByText('Required')).toBeDefined();
    });
});
