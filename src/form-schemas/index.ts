import type { FormSchema } from '@/lib/schema-types';

import checkoutShippingSchema from './checkout-shipping.json';
import contactUsSchema from './contact-us.json';
import newsletterPreferencesSchema from './newsletter-preferences.json';
import userRegistrationSchema from './user-registration.json';

/**
 * Canonical list of bundled demo forms shown in the schema picker.
 */
export const formSchemas: FormSchema[] = [
    userRegistrationSchema,
    contactUsSchema,
    newsletterPreferencesSchema,
    checkoutShippingSchema,
] as FormSchema[];

/**
 * O(1) lookup map used when a schema is referenced by id.
 */
export const formSchemaMap = formSchemas.reduce<Record<string, FormSchema>>((acc, schema) => {
    acc[schema.id] = schema;
    return acc;
}, {});
