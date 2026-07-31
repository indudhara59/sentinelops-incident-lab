# Phase 10 hardening plan

Phase 10 prepares the portfolio for deployment without moving the stateful simulation engine into Vercel. The Next.js application targets Vercel; the single-worker FastAPI/WebSocket process targets Render or Railway; durable account data remains in MongoDB Atlas.

Work is limited to runtime and transport hardening, accessibility and performance review, deployment manifests, continuous integration, security documentation, and portfolio presentation. No external deployment is claimed. Configuration is validated locally where credentials and hosted infrastructure are not required.
