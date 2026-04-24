---
id: python
name: "Python"
layer: backend
domains: [data-engineering, analytics-bi, web-development, devops-infra]
connectsTo: [postgresql, sql-server, airflow, power-bi]
relatedServices: [data-pipeline, analytics-reporting]
relatedProjects: [transit-data-pipeline]
icon: python
proficiency: expert
---

## What it is

Python is a general-purpose programming language known for its readable syntax and massive ecosystem. It's the dominant language in data engineering, machine learning, and scripting — if you need to move data, analyze it, or automate a workflow, Python probably has a library for it. Its "batteries included" standard library and pip package manager make it fast to prototype and deploy.

## Why I use it

Python is my primary language for anything data. pandas for transformation, SQLAlchemy for database access, Airflow for orchestration, pytest for testing — the ecosystem is unmatched for data work. I write Python that's production-grade: typed with mypy, tested, and structured with clear module boundaries. I don't write "notebook Python" for production — I write maintainable code that ops teams can debug at 3 AM.

## In Practice

On the Transit Operations Data Pipeline, Python handles the entire ELT flow: ingesting GTFS-RT feeds, transforming schedule data with pandas, loading into PostgreSQL, and orchestrating the whole pipeline with Airflow. For the Lorem Query Optimizer, Python connects to SQL Server instances and analyzes execution plans programmatically. It's also the glue language in my analytics projects — pulling data from APIs, cleaning it, and loading it into Power BI-ready tables.
