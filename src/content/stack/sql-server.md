---
id: sql-server
name: "SQL Server"
layer: data
domains: [data-engineering, analytics-bi]
connectsTo: [python, ssis, ssrs, t-sql]
relatedServices: [sql-development, database-engineering]
relatedProjects: [lorem-analytics-dashboard]
icon: sql-server
proficiency: expert
---

## What it is

SQL Server is Microsoft's enterprise relational database, widely used in corporate environments for transactional systems, reporting, and business intelligence. It comes with a rich ecosystem: SSMS for management, SSIS for data integration, SSRS for reporting, and tight integration with Power BI and the .NET stack. If your company runs Windows servers and Microsoft tools, SQL Server is likely already in the picture.

## Why I use it

Most of my enterprise clients already run SQL Server — it's the backbone of their ERP, CRM, and financial systems. I know its query optimizer inside out, including its quirks: parameter sniffing, implicit conversions, and the execution plan cache. When I'm tuning performance, I read the actual execution plans, not just the estimated ones. SQL Server's temporal tables and columnstore indexes are underused features that I regularly leverage for audit trails and analytics workloads.

## In Practice

For the Lorem Analytics Dashboard, SQL Server is the primary data source — I built semantic layers in DAX on top of its tables to power executive KPI dashboards. On the Lorem Query Optimizer project, I wrote a Python tool that connects to SQL Server instances, captures execution plans for the heaviest queries, and generates optimization recommendations that reduced average query time by 73% across 200+ stored procedures.
