---
id: docker
name: "Docker"
layer: devops
domains: [devops-infra, data-engineering]
connectsTo: [python, postgresql, node-js]
relatedServices: [data-pipeline]
relatedProjects: [transit-data-pipeline]
icon: docker
proficiency: proficient
---

## What it is

Docker packages applications and their dependencies into containers — lightweight, portable environments that run consistently everywhere. Instead of "it works on my machine" problems, a Docker container bundles your code, runtime, libraries, and configuration into a single image. That image runs identically on your laptop, in CI/CD, and in production. Docker Compose lets you define multi-container setups (app + database + cache) in one file.

## Why I use it

Docker eliminates environment drift — the silent killer of data pipelines and deployments. When I hand off a pipeline to a client's ops team, they run `docker compose up` and get the exact same environment I developed in. No missing Python packages, no wrong PostgreSQL version, no library conflicts. I use Docker for data pipeline development, integration testing (spinning up real databases for tests), and packaging applications for deployment.

## In Practice

The Transit Operations Data Pipeline is fully containerized with Docker — Python services, PostgreSQL, and Airflow all run as Docker containers orchestrated with Docker Compose. This means the entire pipeline can be reproduced in any environment: development laptops, CI runners, and production servers. Docker Compose defines the service dependencies, health checks, and volume mounts, so starting the full pipeline is one command.
