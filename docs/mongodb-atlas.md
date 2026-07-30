# MongoDB Atlas operations

Phase 7 uses an online MongoDB Atlas deployment. Local MongoDB is neither required nor supported.

## Configuration

Set `MONGODB_URI` to an Atlas `mongodb+srv://` connection string and `MONGODB_DB_NAME` to the application database. The server forces TLS, uses the MongoDB Stable API, and shares a bounded pool (`maxPoolSize=20`, idle minimum zero, five-second selection and wait-queue limits). Configuration errors and health checks never include the URI, host, username, or password.

Keep credentials in the deployment secret manager or an uncommitted `.env`. Use a dedicated least-privilege database user. Rotate credentials immediately if they are exposed.

## Network access

In Atlas **Network Access**, allow only the fixed egress addresses of the web deployment. Avoid `0.0.0.0/0` in production. Serverless deployments need their documented egress range or a private networking option. Confirm DNS SRV and TLS egress on port 27017, then use the application health result to verify access.

## Index setup

Run this idempotent command after configuring environment variables:

```bash
pnpm --filter @sentinelops/web db:indexes
```

It pings Atlas and creates authentication, ownership, history, pagination, and TTL indexes. It never drops collections or indexes. Run it with an identity allowed to manage indexes, then return the runtime identity to ordinary data permissions if those roles are separated.

## Testing and failure behavior

Unit tests use fakes and pure query-policy tests; they do not require a database. Any integration test database must end in `_test`. Never point tests at a production database, and never grant test automation production credentials. Atlas outages produce an explicit saved-data-unavailable state while the ephemeral simulation remains usable.
