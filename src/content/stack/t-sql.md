---
id: t-sql
name: "T-SQL"
layer: analytics
domains: [data-engineering, analytics-bi]
connectsTo: [sql-server]
relatedServices: [sql-development, analytics-reporting]
relatedProjects: [lorem-analytics-dashboard]
icon: t-sql
proficiency: expert
---

## What it is

T-SQL (Transact-SQL) is Microsoft's extension of standard SQL, used exclusively with SQL Server. It adds procedural programming features — variables, control flow (IF/WHILE), error handling (TRY/CATCH), and stored procedures — on top of standard SQL queries. If SQL is the language for asking questions of your data, T-SQL is the language for building complete data processing programs inside the database itself.

## Why I use it

T-SQL is my most battle-tested skill. I've written everything from simple SELECT queries to 1000-line stored procedures that process millions of rows nightly. I know the optimizer well enough to predict when it will choose a scan over a seek, when parameter sniffing will cause plan regression, and when a CTE is better than a temp table. Performance tuning T-SQL is where I've delivered the most measurable value to clients — turning 30-minute reports into 30-second queries.

## In Practice

On the Lorem Analytics Dashboard, T-SQL stored procedures handle the ETL logic that feeds Power BI — aggregating transaction data, calculating derived metrics, and maintaining materialized summary tables. The Lorem Query Optimizer project uses T-SQL's DMVs (Dynamic Management Views) to identify slow queries, missing indexes, and execution plan anomalies programmatically. T-SQL is also the foundation of every SQL Server performance audit I conduct.
