---
title: ETL Patterns That Actually Scale
excerpt: Lorem ipsum dolor sit amet. Five battle-tested patterns for building data pipelines that don't break at 3am.
date: 2026-02-28
lang: fr
category: professional
tags: [pipeline, etl]
animation: stagger
external: false
---

# ETL Patterns That Actually Scale

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Every data engineer has been woken up at 3am by a failing pipeline. These patterns help prevent that.

## Pattern 1: Idempotent Loads

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore. The single most important property of any pipeline: running it twice produces the same result as running it once.

```sql
-- Idempotent upsert using ON CONFLICT
INSERT INTO staging.events (event_id, payload, loaded_at)
VALUES ($1, $2, NOW())
ON CONFLICT (event_id) DO UPDATE
SET payload = EXCLUDED.payload,
    loaded_at = NOW();
```

> If your pipeline isn't idempotent, it's a ticking time bomb. It's not a matter of if it will run twice — it's when.

## Pattern 2: Schema-on-Read with JSONB

Lorem ipsum dolor sit amet. Store raw data as JSONB first, parse later:

```sql
-- Land raw data fast
INSERT INTO raw.api_responses (source, payload)
VALUES ('stripe', $1::JSONB);

-- Parse when ready
CREATE VIEW clean.payments AS
SELECT
  payload->>'id' AS payment_id,
  (payload->>'amount')::NUMERIC / 100 AS amount_dollars,
  (payload->>'created')::TIMESTAMPTZ AS created_at
FROM raw.api_responses
WHERE source = 'stripe';
```

## Pattern 3: Watermark Tracking

Track what you've already processed:

- Store the last processed timestamp/ID per source
- On each run, fetch only records **after** the watermark
- Update watermark only after successful processing

## Pattern 4: Dead Letter Queues

Not every record will parse cleanly. Instead of failing the entire batch:

1. Try to process the record
2. On failure, write it to a `dead_letter` table with the error message
3. Continue processing the rest
4. Alert on dead letter count exceeding threshold

## Pattern 5: Backfill by Design

Lorem ipsum dolor sit amet, consectetur adipiscing elit:

- **Partition by date** so you can reprocess one day without touching the rest
- **Parameterize date ranges** in every pipeline step
- **Log processed ranges** for auditability

## Summary

These five patterns won't make your pipeline bulletproof, but they'll make the 3am pages a lot less frequent.