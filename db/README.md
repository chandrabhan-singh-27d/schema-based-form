# Database Tasks (RDBMS)

This folder contains all database work for this project.

## Why this design

Forms in this repo are dynamic JSON schemas. To store that in a relational database, we split data into:

- form metadata (`forms`)
- field metadata (`form_fields`)
- field options (`field_options`)
- conditional rules (`field_conditions`)
- user submissions (`form_submissions`)
- each submitted field value (`submission_answers`)

This keeps schema data normalized and queryable.

## Setup steps

1. Create a PostgreSQL database (example: `schema_forms`).
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` for your local Postgres.
3. Run `db/schema.sql` against your database.
4. Insert current JSON forms into DB:
   - one row in `forms` per JSON file
   - one row in `form_fields` per field
   - option rows for select/radio fields in `field_options`
   - condition rows in `field_conditions`
5. Start the app. Submissions now write through `POST /api/submissions` to PostgreSQL.
6. Verify count from `GET /api/submissions?mode=count`.
7. (Optional) Save each field answer in `submission_answers` when you need analytics per field.

## Suggested execution

```bash
psql "$DATABASE_URL" -f db/schema.sql
```
