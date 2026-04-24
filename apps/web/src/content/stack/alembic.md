---
id: alembic
name: "Alembic"
layer: backend
domains: [data-engineering]
connectsTo: [python, postgresql]
relatedServices: [data-pipeline, database-engineering]
relatedProjects: [transit-data-pipeline]
icon: alembic
proficiency: proficient
---

## What it is

Alembic is a database migration tool for Python, built on top of SQLAlchemy. It version-controls your database schema the same way Git version-controls your code — each change (add a column, create a table, modify a constraint) is a numbered migration file that can be applied forward or rolled back. This means your database structure is reproducible, auditable, and deployable across environments.

## Why I use it

Database changes without migration tooling are a recipe for "it works on my machine" disasters. Alembic gives me version-controlled, reversible schema changes that I can test in staging before touching production. I write every migration with a corresponding downgrade path, and I test both directions against realistic data volumes. The autogenerate feature speeds up development, but I always review the generated SQL — auto-migration tools miss nuances like data backfills and index strategies.

## In Practice

On the Transit Operations Data Pipeline, Alembic manages the PostgreSQL schema as the data model evolves — adding new feed types, modifying KPI calculation tables, and adjusting indexes based on query performance analysis. For the Lorem Database Migration, Alembic tracked every schema change during the MySQL-to-PostgreSQL transition, giving the team a clear audit trail and the ability to roll back any step of the migration independently.
