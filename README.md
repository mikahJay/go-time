# Go-Time

A platform for allocating unused resources to worthy causes.

## Codebase

There will be three interfaces:

1. A React web application in `app`.

2. An iOS mobile application in `iOS`.

3. An Android mobile application in `android`.

All services will be in `services`.

## General Architecture

Interfaces will sit on services hosted in AWS.

Analytics will primarily be run in Snowflake, using dbt-Cloud for execution.