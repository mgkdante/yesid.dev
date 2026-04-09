---
id: dax
name: "DAX"
layer: analytics
domains: [analytics-bi]
connectsTo: [power-bi]
relatedServices: [analytics-reporting]
relatedProjects: [lorem-analytics-dashboard]
icon: dax
proficiency: expert
---

## What it is

DAX (Data Analysis Expressions) is a formula language used in Power BI, Analysis Services, and Power Pivot. Think of it as a specialized language for writing business calculations — revenue growth, running totals, year-over-year comparisons, weighted averages — that work across filtered and sliced data. DAX operates on a columnar data model and uses concepts like filter context and row context to evaluate expressions dynamically as users interact with dashboards.

## Why I use it

DAX is where business logic meets data modeling, and getting it right is the difference between dashboards that perform and dashboards that lie. I write DAX measures that handle complex time intelligence (YTD, prior year comparison, rolling averages), dynamic segmentation, and what-if analysis. I understand the evaluation context deeply — filter context propagation, CALCULATE overrides, and the iterator vs. aggregator distinction that trips up most Power BI developers.

## In Practice

On the Lorem Analytics Dashboard, DAX powers every KPI calculation — from department-level revenue metrics to cross-department comparisons with dynamic date ranges. The semantic layer I built uses DAX measures exclusively (no calculated columns where measures suffice) to keep the model lean and the refreshes fast. Understanding DAX at a deep level means I can diagnose "the numbers don't match" issues that typically take teams days to resolve.
