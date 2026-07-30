# Safety model

SentinelOps Incident Lab is safe by construction: all organizations, services, alerts, data, commands, and outcomes are fictional. The project never connects to, scans, modifies, or interferes with real infrastructure and is not a penetration-testing platform.

## Phase 2 controls

- Scenario content uses invented organizations and environments.
- The authentication scenario is limited to defensive analysis of simulated signals.
- Browser clients receive briefing data, not root causes, hidden evidence, correct solutions, or scoring information.
- Private facilitator content is isolated in a `server-only` module.
- Local session references use 128 bits from Web Crypto and a strict format validator.
- Minimal session metadata stays in `sessionStorage`; there is no server session or durable persistence.
- The operations route is a static explanation. It starts no telemetry, WebSocket, command executor, or external connection.

## Contributor rule

New content must not include real credentials, targets, customer data, exploit instructions, or operational commands intended for real infrastructure. Security-monitoring scenarios must remain defensive and simulated.
