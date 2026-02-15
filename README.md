# Schema-Based Dynamic Form Renderer

A powerful, type-safe dynamic form generator for Next.js applications related. Built with React Hook Form, Zod, and Tailwind CSS, this project allows you to define complex forms entirely via JSON/TypeScript schemas.

## Key Features

- **Schema-Driven**: Define your entire form structure, validation, and layout in a single configuration object.
- **Type-Safe**: Full TypeScript support for schemas ensuring robustness and autocomplete.
- **Zod Integration**: seamless validation using Zod schemas automatically generated from your form definition.
- **Conditional Logic**: Show or hide fields dynamically based on the values of other fields (e.g., show "GitHub URL" only if role is "Developer").
- **Performance Optimized**: Uses `react-hook-form` for minimizing re-renders and optimal performance.
- **Customizable UI**: Styled with Tailwind CSS for easy theming and layout adjustments.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Form Handling**: React Hook Form
- **Validation**: Zod & @hookform/resolvers
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18.17 or later

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/schema-based-form.git
    cd schema-based-form
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

### Running the Project

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the example form.

## Usage

### 1. Define Your Schema

Define your form structure using the `FormSchema` type.

```typescript
import { FormSchema } from "@/lib/schema-types";

const myFormSchema: FormSchema = {
  id: "contact-form",
  title: "Contact Us",
  fields: [
    {
      id: "name",
      type: "text",
      label: "Your Name",
      placeholder: "John Doe",
      validation: { required: true, minLength: 2 }
    },
    {
      id: "email",
      type: "email",
      label: "Email Address",
      validation: { required: true, pattern: "^\\S+@\\S+\\.\\S+$" }
    },
    {
      id: "message",
      type: "textarea",
      label: "Message",
      validation: { required: true, maxLength: 500 }
    }
  ]
};
```

### 2. Render the Form

Import and usage the `DynamicForm` component in your page or component.

```typescript
import { DynamicForm } from "@/components/dynamic-form";

export default function ContactPage() {
  const handleSubmit = (data) => {
    console.log("Form Submitted:", data);
  };

  return (
    <div className="container mx-auto p-4">
      <DynamicForm schema={myFormSchema} onSubmit={handleSubmit} />
    </div>
  );
}
```

## Project Structure

- `src/components/dynamic-form`: Contains the core logic for the form renderer.
  - `field-factory.tsx`: Dispatches the correct component based on field type.
  - `fields/`: Individual field components (Input, Select, Checkbox, etc.).
- `src/lib/schema-types.ts`: TypeScript definitions for the schema structure.
- `src/lib/zod-schema-generator.ts`: Logic to convert the JSON schema into a Zod validation schema.

## Supported Field Types

- `text`
- `email`
- `password`
- `number`
- `textarea`
- `select`
- `checkbox`
- `radio`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
