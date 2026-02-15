import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DynamicForm } from './index';
import { FormSchema } from '@/lib/schema-types';
import contactUsSchema from '@/form-schemas/contact-us.json';

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
    }, 15000);

    it('blocks submit and shows validation message for invalid input', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const onInvalid = vi.fn();

        render(<DynamicForm schema={schema} onSubmit={onSubmit} onInvalid={onInvalid} />);

        await user.click(screen.getByRole('button', { name: 'Submit' }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledTimes(0);
        });
        expect(onInvalid).toHaveBeenCalledTimes(1);

        expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    }, 15000);

    it('does not submit hidden conditional field values', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const conditionalSchema: FormSchema = {
            id: 'conditional-form',
            title: 'Conditional Form',
            fields: [
                {
                    id: 'role',
                    type: 'select',
                    label: 'Role',
                    options: [{ label: 'Admin', value: 'admin' }, { label: 'User', value: 'user' }],
                    validation: { required: true },
                },
                {
                    id: 'adminCode',
                    type: 'text',
                    label: 'Admin Code',
                    conditions: [{ field: 'role', operator: 'eq', value: 'admin' }],
                },
            ],
        };

        render(<DynamicForm schema={conditionalSchema} onSubmit={onSubmit} />);

        await user.selectOptions(screen.getByRole('combobox', { name: /Role/ }), 'admin');
        await user.type(screen.getByLabelText('Admin Code'), 'SECRET');
        await user.selectOptions(screen.getByRole('combobox', { name: /Role/ }), 'user');
        await user.click(screen.getByRole('button', { name: 'Submit' }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledTimes(1);
        });

        expect(onSubmit).toHaveBeenCalledWith({ role: 'user' }, expect.anything());
    }, 15000);

    it('submits contact-us schema when all required values are filled', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<DynamicForm schema={contactUsSchema as FormSchema} onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText(/Your Name/i), 'Jane Doe');
        await user.type(screen.getByLabelText(/Email Address/i), 'jane@example.com');
        await user.selectOptions(screen.getByRole('combobox', { name: /Topic/i }), 'general');
        await user.type(screen.getByLabelText(/Message/i), 'I need help with my account details.');
        await user.click(screen.getByRole('button', { name: 'Submit' }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledTimes(1);
        });
    }, 15000);
});
