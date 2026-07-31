from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=False)


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_and_security_headers() -> None:
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["session_store"] == "available"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert "camera=()" in response.headers["permissions-policy"]


def test_request_id_is_generated_and_returned() -> None:
    response = client.get("/health")
    assert response.headers["x-request-id"]


def test_valid_request_id_is_preserved() -> None:
    response = client.get("/health", headers={"X-Request-ID": "portfolio-test-123"})
    assert response.headers["x-request-id"] == "portfolio-test-123"


def test_error_response_has_consistent_structure() -> None:
    response = client.get("/missing", headers={"X-Request-ID": "not-found-123"})
    assert response.status_code == 404
    assert response.json() == {
        "error": {
            "code": "NOT_FOUND",
            "message": "The requested resource was not found.",
            "details": {},
            "request_id": "not-found-123",
        }
    }


def test_unexpected_error_does_not_leak_stack_trace() -> None:
    response = client.get("/_test/error", headers={"X-Request-ID": "error-123"})
    body = response.json()
    assert response.status_code == 500
    assert body["error"]["code"] == "INTERNAL_SERVER_ERROR"
    assert body["error"]["request_id"] == "error-123"
    assert "traceback" not in response.text.lower()


def test_validation_error_does_not_echo_sensitive_input() -> None:
    response = client.post(
        "/api/v1/sessions",
        json={
            "scenario_slug": "midnight-latency-incident",
            "seed": "secret-value-that-must-not-echo",
        },
    )
    assert response.status_code == 422
    assert "secret-value-that-must-not-echo" not in response.text
