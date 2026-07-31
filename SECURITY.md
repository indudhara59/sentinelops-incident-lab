# Security policy

## Supported version

Security fixes are applied to the current `main` branch. This educational portfolio does not currently publish versioned releases or a public SLA.

## Reporting a vulnerability

Do not open a public issue containing exploit details, credentials, personal data, or a working attack against a deployed instance. Use GitHub private vulnerability reporting when enabled. If it is not enabled, contact the repository owner through the private contact method listed on their GitHub profile.

Include the affected route or component, impact, safe reproduction steps, and suggested remediation. Do not test against accounts, sessions, or infrastructure you do not own. Do not perform denial-of-service testing or access real infrastructure.

## Security boundary

SentinelOps is a fictional incident-response simulator. It does not scan hosts, run shell commands, execute custom scenario code, accept arbitrary network targets, or connect to user-provided infrastructure. Simulation telemetry is synthetic. See [the threat model](docs/threat-model.md) and [security review](docs/security-review.md).
