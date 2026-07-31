"""Validate that the generated OpenAPI document contains the supported HTTP contract."""

from app.main import app

REQUIRED_PATHS = {
    "/api/v1/scenarios",
    "/api/v1/scenarios/{slug}",
    "/api/v1/sessions",
    "/api/v1/sessions/{session_id}/snapshot",
    "/api/v1/sessions/{session_id}/actions",
    "/api/v1/sessions/{session_id}/evidence",
    "/api/v1/sessions/{session_id}/root-cause",
    "/api/v1/sessions/{session_id}/recovery/verify",
    "/api/v1/sessions/{session_id}/report",
}


def main() -> None:
    schema = app.openapi()
    if schema.get("openapi", "").split(".")[0] != "3":
        raise SystemExit("OpenAPI 3.x schema required")
    missing = REQUIRED_PATHS.difference(schema.get("paths", {}))
    if missing:
        raise SystemExit(f"Missing OpenAPI paths: {', '.join(sorted(missing))}")
    print(f"OpenAPI valid: {len(schema['paths'])} documented HTTP paths")


if __name__ == "__main__":
    main()
