---
id: postgresql
name: "PostgreSQL"
layer: data
domains: [data-engineering, web-development, internal-tooling]
connectsTo: [python, sveltekit, node-js]
relatedServices: [sql-development, database-engineering]
relatedProjects: [yesid-dev, transit-data-pipeline]
icon: postgresql
proficiency: expert
---

## What it is

PostgreSQL is an open-source relational database that stores structured data in tables with rows and columns. Think of it as a highly organized filing system where every piece of data has a defined type, relationships are enforced by the system itself, and you can ask complex questions across millions of records in milliseconds. It supports JSON, full-text search, window functions, and extensions — making it one of the most versatile databases available.

## Why I use it

PostgreSQL is my default database for anything that touches production. Its query planner is excellent, CTEs and window functions make complex analytics queries readable, and the extension ecosystem (PostGIS, pg_cron, pgvector) means I rarely need a second database. I've migrated clients off MySQL and SQL Server onto PostgreSQL specifically because it handles the "we also need X" requests without bolting on another tool.

## In Practice

On the Transit Operations Data Pipeline, PostgreSQL serves as the central warehouse — ingesting GTFS-RT feeds, storing transformed schedule data, and powering the KPI queries that feed Power BI dashboards. On yesid.dev, it backs the content layer and will serve as the Keystatic CMS storage when that slice ships. For the Lorem Database Migration, I moved a 500GB MySQL database to PostgreSQL with zero downtime using dual-write and shadow reads.
