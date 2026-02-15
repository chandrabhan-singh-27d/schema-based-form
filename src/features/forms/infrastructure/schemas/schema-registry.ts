import { FormSchema } from '@/features/forms/domain/types';
import checkoutShippingSchema from '@/form-schemas/checkout-shipping.json';
import contactUsSchema from '@/form-schemas/contact-us.json';
import newsletterPreferencesSchema from '@/form-schemas/newsletter-preferences.json';
import userRegistrationSchema from '@/form-schemas/user-registration.json';
import { normalizeFormSchemas } from './normalize-form-schema';

/**
 * Canonical list of bundled schemas validated at load time.
 */
export const formSchemas: FormSchema[] = normalizeFormSchemas([
    userRegistrationSchema,
    contactUsSchema,
    newsletterPreferencesSchema,
    checkoutShippingSchema,
]);

/**
 * O(1) lookup map used when a schema is referenced by id.
 */
export const formSchemaMap = formSchemas.reduce<Record<string, FormSchema>>((acc, schema) => {
    acc[schema.id] = schema;
    return acc;
}, {});
