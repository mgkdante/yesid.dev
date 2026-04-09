---
id: mysql
name: "MySQL"
layer: data
domains: [data-engineering, web-development]
connectsTo: [python, node-js]
relatedServices: [sql-development, database-engineering]
relatedProjects: []
icon: mysql
proficiency: proficient
---

## What it is

MySQL is one of the most widely deployed relational databases in the world, especially in web applications. It stores data in tables with defined schemas, supports transactions, and is the "M" in the classic LAMP stack (Linux, Apache, MySQL, PHP). It's fast for read-heavy workloads and has a massive community with extensive documentation and tooling.

## Why I use it

MySQL shows up in legacy systems more than in my new projects. I'm proficient at working with it — optimizing queries, designing schemas, managing replication — but I typically recommend PostgreSQL for new work because of its richer feature set. That said, when a client's infrastructure is already MySQL-based, I work within that ecosystem rather than pushing an unnecessary migration. Knowing both MySQL and PostgreSQL well means I can make honest recommendations about when a migration is worth the effort.

## In Practice

MySQL has been the source database in several migration projects I've handled. The Lorem Database Migration started as a MySQL instance that had outgrown its schema design — I mapped every data type, converted stored procedures, and built the dual-write migration path to PostgreSQL. Understanding MySQL's storage engines and locking behavior was critical to planning the zero-downtime cutover.
