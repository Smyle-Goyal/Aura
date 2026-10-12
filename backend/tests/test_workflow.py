def test_agentic_workflow_run(client):
    projects_res = client.get("/api/projects")
    projects = projects_res.json()
    if not projects:
        return

    project_id = projects[0]["id"]
    papers_res = client.get(f"/api/papers?project_id={project_id}")
    papers = papers_res.json()

    run_req = {
        "project_id": project_id,
        "objective": "Compare recent retrieval-augmented architectures and formulate future directions.",
        "paper_ids": [p["id"] for p in papers[:2]]
    }

    # 1. Create run
    res = client.post("/api/workflows/runs", json=run_req)
    assert res.status_code == 201
    run_data = res.json()
    run_id = run_data["id"]
    assert run_data["status"] in ["pending", "running", "completed"]

    # 2. Poll/inspect status
    res_get = client.get(f"/api/workflows/runs/{run_id}")
    assert res_get.status_code == 200
    detail = res_get.json()
    assert detail["id"] == run_id
    assert "stages" in detail

    # 3. List runs
    res_list = client.get(f"/api/workflows/runs?project_id={project_id}")
    assert res_list.status_code == 200
    assert any(r["id"] == run_id for r in res_list.json())
