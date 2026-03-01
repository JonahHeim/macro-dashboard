# Persistence Schema

Apply `db/schema.sql` to your Postgres database before enabling `DATABASE_URL`.

Suggested flow:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

When `DATABASE_URL` is set, ingest runs persist score snapshots and transformed metric points to Postgres in addition to local `.macro-persistence` files.
