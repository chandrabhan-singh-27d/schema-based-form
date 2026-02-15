"use client";

import { DynamicForm } from "@/components/dynamic-form";
import { FormSchema } from "@/lib/schema-types";
import { useState } from "react";
import { FieldValues } from "react-hook-form";

const SAMPLE_SCHEMA: FormSchema = {
  id: "user-registration",
  title: "User Registration",
  description: "Please fill out the form below to create an account. Fields marked with * are required.",
  fields: [
    {
      id: "fullName",
      type: "text",
      label: "Full Name",
      placeholder: "John Doe",
      validation: {
        required: true,
        minLength: 2,
        message: "Full name is required and must be at least 2 characters",
      },
    },
    {
      id: "email",
      type: "email",
      label: "Email Address",
      placeholder: "john@example.com",
      validation: {
        required: true,
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        message: "Please enter a valid email address",
      },
    },
    {
      id: "password",
      type: "password",
      label: "Password",
      placeholder: "********",
      validation: {
        required: true,
        minLength: 8,
        message: "Password must be at least 8 characters",
      },
    },
    {
      id: "role",
      type: "select",
      label: "Role",
      placeholder: "Select a role",
      options: [
        { label: "User", value: "user" },
        { label: "Admin", value: "admin" },
        { label: "Developer", value: "developer" },
      ],
      validation: {
        required: true,
      },
    },
    {
      id: "githubUrl",
      type: "text",
      label: "GitHub Profile URL",
      placeholder: "https://github.com/...",
      conditions: [
        {
          field: "role",
          operator: "eq",
          value: "developer",
        },
      ],
      validation: {
        pattern: "^https:\\/\\/github\\.com\\/.*$",
        message: "Must be a valid GitHub URL"
      }
    },
    {
      id: "adminCode",
      type: "text",
      label: "Admin Access Code",
      placeholder: "Enter admin code",
      conditions: [
        {
          field: "role",
          operator: "eq",
          value: "admin",
        },
      ],
      validation: {
        required: true,
      },
    },
    {
      id: "newsletter",
      type: "checkbox",
      label: "Subscribe to newsletter",
      description: "Receive updates about our products.",
    },
    {
      id: "newsletterFrequency",
      type: "radio",
      label: "Newsletter Frequency",
      options: [
        { label: "Weekly", value: "weekly" },
        { label: "Monthly", value: "monthly" },
      ],
      conditions: [
        {
          field: "newsletter",
          operator: "eq",
          value: true,
        },
      ],
      validation: {
        required: true
      }
    },
    {
      id: "bio",
      type: "textarea",
      label: "Bio",
      placeholder: "Tell us a bit about yourself",
      validation: {
        maxLength: 200,
      }
    }
  ],
};

export default function Home() {
  const [formData, setFormData] = useState<FieldValues | null>(null);

  const handleSubmit = (data: FieldValues) => {
    console.log("Form Submitted:", data);
    setFormData(data);
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-50">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div className="w-full">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Dynamic Form Renderer</h1>
          <DynamicForm schema={SAMPLE_SCHEMA} onSubmit={handleSubmit} />

          {formData && (
            <div className="mt-8 p-4 bg-gray-100 rounded-md max-w-2xl mx-auto">
              <h3 className="text-lg font-bold mb-2">Submitted Data:</h3>
              <pre className="whitespace-pre-wrap">{JSON.stringify(formData, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
