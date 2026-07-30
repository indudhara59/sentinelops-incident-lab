# Evidence-based scoring

The final score has ten equally bounded categories: impact assessment, telemetry investigation, evidence quality, hypothesis quality, root-cause identification, mitigation selection, recovery verification, incident documentation, operational safety, and efficiency. Each is 0–10 and the total is 0–100.

The rubric rewards linked, diverse evidence and supported reasoning. Creating or rejecting a reasonable hypothesis never incurs a penalty. High confidence alone cannot earn root-cause credit. An unsupported conclusion receives limited credit even when asserted confidently.

For Midnight Latency, rollback is the safest primary mitigation. Restart receives partial credit as temporary relief; scaling or a larger pool can delay symptoms but do not resolve the leak. Increasing the pool, pausing an unrelated consumer, repeated restarts, and excessive repeated actions reduce only the relevant safety or efficiency categories. Exploration within a reasonable action budget is unpenalized.

Every category includes a human-readable explanation. This educational result is not an official SRE certification or employment assessment.
