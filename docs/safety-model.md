# Safety model

SentinelOps Incident Lab is safe by construction: all organizations, services, alerts, data, commands, and outcomes are fictional. The project never connects to, scans, modifies, or interferes with real infrastructure and is not a penetration-testing platform.

## Phase 5 controls

- Scenario content uses invented organizations and environments.
- The authentication scenario is limited to defensive analysis of simulated signals.
- Browser clients receive briefing data, not root causes, hidden evidence, correct solutions, or scoring information.
- Private facilitator content is isolated in a `server-only` module.
- Local session references use 128 bits from Web Crypto and a strict format validator.
- Minimal session metadata stays in `sessionStorage`; authoritative session state is bounded, ephemeral server memory with a TTL and no durable persistence.
- Scenario selection is an allowlisted registry lookup. Request data cannot import code or select arbitrary classes.
- Action controls invoke fixed validated simulation transitions only; there is no Python evaluation, subprocess, shell, or real operational command path.
- Logs, metrics, traces, alerts, deployments, service health, and recovery are generated from fictional definitions.
- Simulated logs contain safe identifiers and attributes only: no secrets, credentials, real people, customer data, or real repository commit values.
- Alert acknowledgement, assignment, and silencing change local workflow state without deleting the signal or its evidence.
- Correlation search parameters are allow-listed investigation context, not telemetry or session persistence.
- Reset reproduces the same seed, and all runtime histories are bounded in memory.
- REST and WebSocket failures expose structured codes and request IDs without stack traces or hidden scenario material.

## Contributor rule

New content must not include real credentials, targets, customer data, exploit instructions, or operational commands intended for real infrastructure. Security-monitoring scenarios must remain defensive and simulated.
