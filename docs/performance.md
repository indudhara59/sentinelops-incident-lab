# Performance review

- The service topology uses a bounded, keyboard-accessible native visualization rather than shipping a large graph runtime. Nodes are scenario-limited.
- Telemetry histories are bounded server-side and client-side: 100 logs, 120 metric samples, 60 traces, and 160 events. At those limits virtualization would add complexity without a meaningful DOM benefit; filters and summaries are memoized and trace/log rows expand on demand.
- Telemetry arrives in batches. Subscriber queues retain at most 32 envelopes and authoritative snapshots recover dropped intermediate events.
- Simulation timers have one runner per session, cancellable cleanup, unmount guards, bounded reconnection backoff, and polling fallback. No request is made per individual telemetry item.
- Charts use lightweight semantic HTML/SVG-free plots with accessible tables and reduced-motion behavior. Operations explorers are memoized to limit unrelated rerenders.
- MongoDB queries use bounded pagination, safe sort allowlists, owner-first indexes, cursor-friendly date/ID indexes, and capped result sets.
- FastAPI compresses responses larger than 1 KiB. WebSocket messages are already bounded batches and are not recompressed in application code.
- Next.js prerenders public catalog, briefing, and learning pages. Dynamic authentication and owner data remain server-rendered. The production build is the bundle-size gate; no large optional visualization dependency is present.

Future profiling should use hosted Web Vitals and provider memory metrics. Virtualize logs only if product limits are deliberately raised, and replace the process-local engine before adding horizontal scaling.
