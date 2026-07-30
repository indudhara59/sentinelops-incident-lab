# Log explorer

The log explorer presents a bounded, simulated live tail. Players can pause the displayed snapshot without pausing the incident, search messages and identifiers, and filter by service, severity, time range, or a structured `key=value` field.

Rows expose timestamp, severity, `service.name`, message, trace and span IDs, request ID, deployment version, and safe structured attributes. Details expand on demand, can be copied as safe JSON, and can be collected as evidence. Trace links retain the selected service and trace context.

No generated message or attribute contains a password, token, credential, real personal data, real host, or real customer identifier. An empty result explains that filters can be changed or reset.
