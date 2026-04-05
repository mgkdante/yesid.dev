---
title: Why I Left ORM for Raw SQL
excerpt: After years of fighting with ORMs, I switched to raw SQL and never looked back. Here is what I learned about control, performance, and knowing your database.
date: 2026-04-01
lang: en
category: professional
tags: [sql, postgresql, opinion]
animation: draw
external: false
---

# Why I Left ORM for Raw SQL

For years, I relied on ORMs — SQLAlchemy, Django ORM, Prisma. They promised productivity. They delivered abstraction. But somewhere along the way, I stopped understanding what my database was actually doing.

## The Breaking Point

It happened on a Tuesday. A query that should have taken 50ms was taking 12 seconds. The ORM had generated a nested subquery with 4 JOINs when a simple CTE would have done the job. I spent 3 hours debugging the ORM's query builder before giving up and writing the SQL myself.

The raw SQL took 47ms.

## What I Learned

1. **You need to know your database.** ORMs hide the database behind an abstraction. That's fine until the abstraction leaks — and it always leaks.

2. **SQL is already a DSL.** We don't need another language on top of a language designed for exactly this purpose.

3. **Performance tuning requires SQL literacy.** You can't optimize what you can't read. EXPLAIN ANALYZE doesn't speak ORM.

4. **Migrations are where ORMs shine.** I still use migration tools. But the queries themselves? Raw SQL, every time.

## My Stack Now

- **PostgreSQL** for everything stateful
- **Raw SQL** with parameterized queries
- **dbt** for transformations
- **pg_stat_statements** for monitoring

The code is longer. The control is absolute. The performance is predictable.

I'm not going back.
