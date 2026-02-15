"use client";

import { DynamicForm } from "@/components/dynamic-form";
import { formSchemas } from "@/form-schemas";
import { useMemo, useState } from "react";
import { FieldErrors, FieldValues } from "react-hook-form";
import { Toaster } from "sonner";
import { getFirstErrorMessage } from "@/features/forms/application/use-cases/get-first-error-message";
import { createSubmitFormUseCase } from "@/features/forms/application/use-cases/submit-form";
import { sessionSubmissionRepository } from "@/features/forms/infrastructure/persistence/session-submission-repository";
import { sonnerNotifier } from "@/features/forms/infrastructure/notifications/sonner-notifier";
import { useSessionSubmissionCount } from "@/features/forms/presentation/hooks/use-session-submission-count";

export default function Home() {
  const defaultSchemaId = formSchemas[0]?.id ?? "";
  const [selectedSchemaId, setSelectedSchemaId] = useState(defaultSchemaId);
  const sessionSubmissionCount = useSessionSubmissionCount(sessionSubmissionRepository);
  const activeSchema = formSchemas.find((schema) => schema.id === selectedSchemaId);
  const submitForm = useMemo(
    () =>
      createSubmitFormUseCase({
        repository: sessionSubmissionRepository,
        notifier: sonnerNotifier,
      }),
    []
  );

  /**
   * Persists a valid submission and shows user-facing feedback.
   */
  const handleSubmit = (data: FieldValues) => {
    if (!activeSchema) {
      return;
    }
    submitForm(activeSchema, data);
    console.log("Form Submitted:", data);
  };

  /**
   * Displays a concise global error toast while inline field errors remain visible.
   */
  const handleInvalidSubmit = (errors: FieldErrors<FieldValues>) => {
    const firstError = getFirstErrorMessage(errors);
    sonnerNotifier.error("Please check the highlighted fields", firstError ?? "Validation failed. Check the inline error messages.");
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
              suppressHydrationWarning
              autoComplete="off"
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
