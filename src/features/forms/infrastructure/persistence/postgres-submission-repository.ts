import { SubmissionRepository } from "@forms/application/ports/submission-repository";
import { SubmissionRecord } from "@forms/domain/types";

export const postgresSubmissionRepository: SubmissionRepository = {
  list: async () => {
    const response = await fetch("/api/submissions", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch submissions.");
    }

    const payload = (await response.json()) as { submissions: SubmissionRecord[] };
    return payload.submissions ?? [];
  },
  save: async (submission) => {
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });

    if (!response.ok) {
      throw new Error("Failed to save submission.");
    }

    return [];
  },
  count: async () => {
    const response = await fetch("/api/submissions?mode=count", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch submission count.");
    }

    const payload = (await response.json()) as { count: number };
    return payload.count ?? 0;
  },
};

