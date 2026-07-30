# Trace explorer

The trace explorer supports identifier search, service filtering, minimum duration, and status inspection. A selected trace renders its parent-child span waterfall, duration, status, safe attributes, related logs, and an accessible table.

Critical-path spans are identified from the deterministic hierarchy and labelled in text as well as visually. Slow incident traces show increasing `order-service` time in database connection acquisition, but neither the explorer nor its evidence labels declare a root cause or correct answer.

Players can open correlated logs or collect an individual span as evidence. Trace histories and visible result lists are bounded.
