---
title: Building a Transit Data Pipeline
excerpt: How I designed an ELT pipeline to process real-time GTFS feeds for a Quebec transit operator — from ingestion to dashboard.
date: 2026-03-15
lang: en
category: professional
tags: [etl, postgresql, python, case-study]
animation: morph
external: false
---

# Building a Transit Data Pipeline

When a Quebec transit operator needed real-time visibility into their operations, they had data — lots of it. GTFS-RT feeds streaming vehicle positions, trip updates, and service alerts every 15 seconds. What they didn't have was a way to turn that firehose into decisions.

## The Architecture

The pipeline follows an ELT pattern:

1. **Extract:** Python scripts poll GTFS-RT protobuf feeds every 15 seconds
2. **Load:** Raw data lands in a PostgreSQL staging schema
3. **Transform:** dbt models clean, deduplicate, and aggregate into analytics-ready tables

## Key Decisions

### Why PostgreSQL over a data warehouse?

The data volume (< 50GB/month) didn't justify Snowflake or BigQuery costs. PostgreSQL with proper indexing handles the analytical queries under 2 seconds. Sometimes the boring choice is the right choice.

### Why ELT over ETL?

Loading raw data first means we never lose fidelity. When the PM asked "can we also track schedule adherence?" three months in, the raw data was already there. We just added a dbt model.

### Why dbt?

Version-controlled transformations. Every business rule is a SQL file with tests. When the on-time definition changed from "within 5 minutes" to "within 3 minutes," it was a one-line diff.

## The Dashboard

Power BI connects directly to the analytics schema. KPIs include:
- On-time performance by route and time period
- Fleet utilization rates
- Service alert response times

The operator went from weekly Excel reports to real-time dashboards in 6 weeks.

## What I'd Do Differently

- Use Apache Airflow from day one instead of cron. The monitoring alone is worth it.
- Add data quality checks earlier in the pipeline. Bad upstream data cascaded into confusing dashboard numbers for two days before we caught it.
