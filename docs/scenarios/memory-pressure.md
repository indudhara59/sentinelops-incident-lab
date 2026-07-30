# Memory Under Pressure

Image worker 3.3.1 retains decoded buffers after completed work. The upload, job queue, worker, object storage, and metadata topology produces monotonic memory, restart, OOM-like safe logs, and image-span evidence. Rollback is primary; restart and scaling provide temporary relief. Recovery requires stable memory, restart count, and processing failures.
