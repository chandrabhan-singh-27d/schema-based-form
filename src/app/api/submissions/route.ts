import { NextRequest, NextResponse } from "next/server";
import { getPostgresPool } from "@/lib/postgres";

interface SubmissionPayload {
  schemaId: string;
  schemaTitle: string;
  submittedAt?: string;
  data: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("mode");
    const pool = getPostgresPool();

    if (mode === "count") {
      const result = await pool.query<{ total: number }>("SELECT COUNT(*)::int AS total FROM form_submissions;");
      return NextResponse.json({ count: result.rows[0]?.total ?? 0 });
    }

    const result = await pool.query<{
      schema_id: string;
      schema_title: string;
      submitted_at: string;
      payload: Record<string, unknown>;
    }>(
      `
      SELECT schema_id, schema_title, submitted_at, payload
      FROM form_submissions
      ORDER BY submitted_at DESC
      LIMIT 30;
    `
    );

    const submissions = result.rows.map((row) => ({
      schemaId: row.schema_id,
      schemaTitle: row.schema_title,
      submittedAt: row.submitted_at,
      data: row.payload,
    }));

    return NextResponse.json({ submissions });
  } catch {
    return NextResponse.json({ error: "Failed to read submissions from PostgreSQL." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubmissionPayload;

    if (!body?.schemaId || !body?.schemaTitle || !body?.data) {
      return NextResponse.json({ error: "Invalid submission payload." }, { status: 400 });
    }

    const submittedAt = body.submittedAt ? new Date(body.submittedAt) : new Date();
    const pool = getPostgresPool();

    await pool.query(
      `
      INSERT INTO form_submissions (schema_id, schema_title, payload, submitted_at)
      VALUES ($1, $2, $3::jsonb, $4);
    `,
      [body.schemaId, body.schemaTitle, JSON.stringify(body.data), submittedAt.toISOString()]
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to store submission in PostgreSQL." }, { status: 500 });
  }
}
