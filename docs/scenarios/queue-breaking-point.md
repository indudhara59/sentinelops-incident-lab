# Queue at the Breaking Point

A notification consumer slowdown and fixed-delay retry amplification grow a delivery backlog. The distinct notification API, queue, consumer, template, and provider topology emits deterministic lag, queue, retry log, and repeated-span evidence. Disabling retry amplification is primary; scaling or restart is temporary, and pausing consumption increases risk. Recovery requires queue depth, delay, and failure signals to remain normal across the stable window.
