"use client";

import { DynamicForm } from "@/components/dynamic-form";
import { formSchemas } from "@/form-schemas";
import { useState } from "react";
import { FieldError, FieldErrors, FieldValues } from "react-hook-form";
import { Toaster, toast } from "sonner";

const SESSION_STORAGE_KEY = "dynamic-form:submissions";

type StoredSubmission = {
  schemaId: string;
  schemaTitle: string;
  submittedAt: string;
  data: FieldValues;
};

export default function Home() {
  const defaultSchemaId = formSchemas[0]?.id ?? "";
  const [selectedSchemaId, setSelectedSchemaId] = useState(defaultSchemaId);
  const [sessionSubmissionCount, setSessionSubmissionCount] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }

    try {
      const rawSubmissions = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      const parsedSubmissions = rawSubmissions ? (JSON.parse(rawSubmissions) as StoredSubmission[]) : [];
      return parsedSubmissions.length;
    } catch {
      return 0;
    }
  });
  const activeSchema = formSchemas.find((schema) => schema.id === selectedSchemaId);

  const handleSubmit = (data: FieldValues) => {
    if (!activeSchema) {
      return;
    }

    const submission: StoredSubmission = {
      schemaId: activeSchema.id,
      schemaTitle: activeSchema.title,
      submittedAt: new Date().toISOString(),
      data,
    };

    try {
      const rawSubmissions = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      const parsedSubmissions = rawSubmissions ? (JSON.parse(rawSubmissions) as StoredSubmission[]) : [];
      const nextSubmissions = [submission, ...parsedSubmissions].slice(0, 30);
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSubmissions));
      setSessionSubmissionCount(nextSubmissions.length);
      toast.success("Submitted successfully", {
        description: activeSchema.successMessage ?? "Response saved in this session.",
      });
    } catch {
      toast.error("Couldn't save your response", {
        description: "Your submission went through, but we couldn't save it in this browser session.",
      });
    }

    console.log("Form Submitted:", data);
  };

  const getFirstErrorMessage = (errors: FieldErrors<FieldValues>): string | undefined => {
    const queue = Object.values(errors) as Array<FieldError | FieldErrors<FieldValues> | undefined>;

    while (queue.length > 0) {
      const entry = queue.shift();
      if (!entry) continue;

      if ("message" in entry && typeof entry.message === "string") {
        return entry.message;
      }

      if (typeof entry === "object") {
        queue.push(...(Object.values(entry) as Array<FieldError | FieldErrors<FieldValues> | undefined>));
      }
    }

    return undefined;
  };

  const handleInvalidSubmit = (errors: FieldErrors<FieldValues>) => {
    const firstError = getFirstErrorMessage(errors);
    toast.error("Please check the highlighted fields", {
      description: firstError ?? "Validation failed. Check the inline error messages.",
    });
  };

  if (!activeSchema) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 bg-gray-50">
        <p className="text-lg text-gray-700">No form schemas found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="w-full">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
            Dynamic Form Renderer
          </h1>
          <div className="mb-4 text-sm text-gray-700">
            Session responses: <span className="font-semibold">{sessionSubmissionCount}</span>
          </div>
          <div className="w-full mb-4 sm:mb-6 rounded-lg bg-white p-4 sm:p-5 shadow-md">
            <label htmlFor="formSelector" className="block text-sm font-semibold mb-2 text-gray-700">
              Select Form
            </label>
            <select
              id="formSelector"
              value={selectedSchemaId}
              onChange={(event) => {
                setSelectedSchemaId(event.target.value);
              }}
              className="w-full h-11 rounded-md border border-gray-300 bg-white px-3 text-base"
            >
              {formSchemas.map((schema) => (
                <option key={schema.id} value={schema.id}>
                  {schema.title}
                </option>
              ))}
            </select>
          </div>
          <DynamicForm
            key={activeSchema.id}
            schema={activeSchema}
            onSubmit={handleSubmit}
            onInvalid={handleInvalidSubmit}
            className="max-w-none p-4 sm:p-6"
          />
        </div>
      </div>
      <Toaster
        richColors
        closeButton
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
          },
        }}
      />
    </main>
  );
}
