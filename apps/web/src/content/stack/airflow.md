---
id: airflow
name: "Apache Airflow"
layer: analytics
domains: [data-engineering, devops-infra]
connectsTo: [python, postgresql]
relatedServices: [data-pipeline]
relatedProjects: [transit-data-pipeline]
icon: airflow
proficiency: proficient
---

## What it is

Apache Airflow is a workflow orchestration platform that lets you define, schedule, and monitor data pipelines as Python code. Instead of cron jobs or manual scripts, you write DAGs (Directed Acyclic Graphs) that declare tasks and their dependencies — "extract data, then transform it, then load it, and if any step fails, retry three times and alert me." Airflow provides a web UI for monitoring, a scheduler for timing, and integrations with virtually every data tool.

## Why I use it

Airflow turns "a bunch of scripts that run in order" into a proper orchestration system with retries, logging, alerting, and dependency management. I use it when pipelines have multiple steps that need to run in a specific order, when failures need automatic retry logic, and when stakeholders need visibility into pipeline health. I write DAGs as Python code (not YAML configuration), which means the full power of Python is available for dynamic task generation and conditional logic.

## In Practice

The Transit Operations Data Pipeline runs on Airflow — orchestrating the daily cycle of GTFS-RT feed ingestion, Python transformations, PostgreSQL loads, and Power BI dataset refreshes. Each task has retry logic, SLA alerts, and dependency chains that ensure data quality gates pass before downstream consumers see new data. Airflow's web UI gives the operations team visibility into pipeline health without needing to SSH into servers or read log files.
