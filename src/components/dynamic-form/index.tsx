import React, { useMemo } from 'react';
import { useForm, FieldValues, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSchema } from '@/lib/schema-types';
import { generateZodSchema } from '@/lib/zod-schema-generator';
import { FieldFactory } from './field-factory';
import { cn } from '@/lib/utils';

interface DynamicFormProps {
    schema: FormSchema;
    onSubmit: (data: FieldValues) => void;
    onInvalid?: (errors: FieldErrors<FieldValues>) => void;
    className?: string;
    defaultValues?: FieldValues;
}

/**
 * Renders a form from schema metadata and validates it with a generated Zod schema.
 */
export const DynamicForm: React.FC<DynamicFormProps> = ({ schema, onSubmit, onInvalid, className, defaultValues }) => {
    const zodSchema = useMemo(() => generateZodSchema(schema.fields), [schema.fields]);

    const form = useForm({
        resolver: zodResolver(zodSchema),
        defaultValues: defaultValues || {},
        shouldUnregister: true,
        mode: 'onBlur', // Validate on blur for better performance
    });

    const { handleSubmit, formState: { isSubmitting } } = form;

    return (
        <div className={cn("w-full max-w-2xl mx-auto p-4 sm:p-6 bg-white text-gray-900 rounded-lg shadow-md", className)}>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">{schema.title}</h2>
            {schema.description && <p className="text-gray-700 mb-6">{schema.description}</p>}

            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6" noValidate>
                {schema.fields.map((field) => (
                    <FieldFactory key={field.id} field={field} form={form} />
                ))}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
            </form>
        </div>
    );
};
