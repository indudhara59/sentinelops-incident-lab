# Safety model

SentinelOps Incident Lab is safe by construction: all organizations, services, alerts, data, commands, and outcomes are fictional. The project never connects to, scans, modifies, or interferes with real infrastructure and is not a penetration-testing platform.

## Phase 3 controls

- Scenario content uses invented organizations and environments.
- The authentication scenario is limited to defensive analysis of simulated signals.
- Browser clients receive briefing data, not root causes, hidden evidence, correct solutions, or scoring information.
- Private facilitator content is isolated in a `server-only` module.
- Local session references use 128 bits from Web Crypto and a strict format validator.
- Minimal session metadata stays in `sessionStorage`; there is no server session or durable persistence.
- The operations engine is a pure browser reducer. It makes no telemetry requests and opens no WebSocket.
- Action controls dispatch local state events only; they cannot execute commands.
- Logs, metrics, traces, alerts, deployments, service health, and recovery are generated from fictional definitions.
- Reset reproduces the same seed, and all runtime histories are bounded in memory.

## Contributor rule

New content must not include real credentials, targets, customer data, exploit instructions, or operational commands intended for real infrastructure. Security-monitoring scenarios must remain defensive and simulated.
