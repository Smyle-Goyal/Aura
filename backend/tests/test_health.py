def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "AURA" in data["app_name"]
    assert "version" in data
    assert "services" in data
    assert "database" in data["services"]
    assert "qdrant" in data["services"]
    assert "gemini_api" in data["services"]
    assert "file_storage" in data["services"]
    # Check that secrets are NOT exposed
    assert "AIza" not in response.text
    assert "secret" not in response.text.lower()
