---
title: Designing a Star Schema from Scratch
excerpt: Lorem ipsum dolor sit amet, consectetur adipiscing elit. A practical walkthrough of dimensional modeling for analytics warehouses.
date: 2026-03-20
lang: en
category: professional
tags: [sql, warehousing]
animation: draw-fill
external: false
---

# Designing a Star Schema from Scratch

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

## Why Dimensional Modeling?

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

> The goal of a data warehouse is not to store data — it's to answer questions. Dimensional modeling makes questions easy.

### Fact Tables vs Dimension Tables

Lorem ipsum dolor sit amet:

- **Fact tables** hold the measurements (revenue, count, duration)
- **Dimension tables** hold the context (who, what, when, where)

```sql
CREATE TABLE fact_orders (
  order_id BIGINT PRIMARY KEY,
  customer_key INT REFERENCES dim_customer(customer_key),
  product_key INT REFERENCES dim_product(product_key),
  date_key INT REFERENCES dim_date(date_key),
  quantity INT NOT NULL,
  revenue NUMERIC(12,2) NOT NULL
);
```

## The Grain Decision

Excepteur sint occaecat cupidatat non proident. The grain defines the most atomic level of detail in your fact table. Get this wrong and everything built on top crumbles.

### Common Mistakes

1. **Too coarse** — aggregating before loading loses detail you'll need later
2. **Too fine** — transaction-level grain on a slow-changing dimension creates massive tables
3. **Mixed grains** — combining daily and monthly facts in one table causes join confusion

## Building the Date Dimension

Every warehouse needs a date dimension. Here's a generator:

```sql
INSERT INTO dim_date (date_key, full_date, year, quarter, month, day_of_week)
SELECT
  TO_CHAR(d, 'YYYYMMDD')::INT,
  d,
  EXTRACT(YEAR FROM d),
  EXTRACT(QUARTER FROM d),
  EXTRACT(MONTH FROM d),
  TO_CHAR(d, 'Day')
FROM generate_series('2020-01-01'::DATE, '2030-12-31'::DATE, '1 day') AS d;
```

## Lessons Learned

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

- **Start with the questions**, not the data
- **Denormalize intentionally** — warehouse != OLTP
- [PostgreSQL dimensional modeling guide](https://example.com) for deeper reading
