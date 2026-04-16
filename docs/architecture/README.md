# Amanat Architecture Analysis

This folder contains a code-based analysis of the current repository state as of 2026-04-16.

The analysis is based on the actual implementation in:
- `backend/`
- `frontend/`
- `telegram_bot/`
- `deploy/`

It describes how the system works today, how containers interact, the main request/data flows, and important implementation gaps discovered during review.

## Document map

1. [01-system-overview.md](./01-system-overview.md)
   - High-level architecture
   - Main services and responsibilities
   - Runtime topology

2. [02-container-flows.md](./02-container-flows.md)
   - Startup flow of every container
   - Network paths between containers
   - End-to-end request flows

3. [03-backend-analysis.md](./03-backend-analysis.md)
   - Django project structure
   - App-by-app analysis
   - API behavior, domain model, background tasks

4. [04-frontend-analysis.md](./04-frontend-analysis.md)
   - Next.js structure
   - Authentication and routing
   - State, API integration, UI flows

5. [05-telegram-bot-analysis.md](./05-telegram-bot-analysis.md)
   - Bot command flow
   - Backend integration
   - Citizen conversation lifecycle

6. [06-domain-data-and-lifecycle.md](./06-domain-data-and-lifecycle.md)
   - Core entities
   - Appeal lifecycle
   - Messaging lifecycle
   - Notification lifecycle

7. [07-observed-gaps-and-risks.md](./07-observed-gaps-and-risks.md)
   - Implementation inconsistencies
   - Broken/misaligned flows
   - Operational risks to be aware of

8. [08-development-workflow.md](./08-development-workflow.md)
   - Recommended local development workflow
   - Docker-based dev stack
   - Setup, startup, commands, and team conventions

## Important note

This analysis intentionally distinguishes between:
- **Designed architecture**: what the project appears to intend
- **Implemented architecture**: what the current code actually does

Where these differ, the difference is called out explicitly.
