def test_project_crud(client):
    # 1. Create project
    payload = {
        "title": "Quantum Error Mitigation in NISQ Architectures",
        "description": "Exploration of zero-noise extrapolation and probabilistic error cancellation.",
        "research_question": "What is the optimal noise scaling factor for shallow Clifford circuits?"
    }
    res = client.post("/api/projects", json=payload)
    assert res.status_code == 201
    created = res.json()
    project_id = created["id"]
    assert created["title"] == payload["title"]
    assert created["research_question"] == payload["research_question"]
    assert created["is_archived"] is False

    # 2. Get project by ID
    res_get = client.get(f"/api/projects/{project_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == project_id

    # 3. List projects
    res_list = client.get("/api/projects")
    assert res_list.status_code == 200
    ids = [p["id"] for p in res_list.json()]
    assert project_id in ids

    # 4. Update project
    update_payload = {"title": "Updated Quantum Error Mitigation"}
    res_update = client.put(f"/api/projects/{project_id}", json=update_payload)
    assert res_update.status_code == 200
    assert res_update.json()["title"] == "Updated Quantum Error Mitigation"

    # 5. Archive project
    archive_payload = {"is_archived": True}
    res_arch = client.put(f"/api/projects/{project_id}", json=archive_payload)
    assert res_arch.status_code == 200
    assert res_arch.json()["is_archived"] is True

    # 6. Delete project
    res_del = client.delete(f"/api/projects/{project_id}")
    assert res_del.status_code == 204

    # Verify 404
    res_verify = client.get(f"/api/projects/{project_id}")
    assert res_verify.status_code == 404
