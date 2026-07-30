# OpenTelemetry compatibility

SentinelOps uses OpenTelemetry-compatible concepts to teach correlation without connecting to an OpenTelemetry collector or claiming protocol conformance.

Simulated logs use `timestamp`, `severity`, `service.name`, `trace_id`, `span_id`, `deployment.version`, `request_id`, `message`, and safe attributes. Traces use 32-character trace IDs, 16-character span IDs, parent span IDs, service names, start times, durations, statuses, and attributes. Metrics use named, timestamped service measurements.

Shared identifiers allow log-to-trace and trace-to-log navigation. The data is local TypeScript state: it is not OTLP, is not exported, and is not accepted from external services. A future integration must preserve the safety boundary and cannot silently reinterpret this fictional schema as real telemetry.
