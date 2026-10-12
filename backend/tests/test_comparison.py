def test_paper_comparison(client):
    projects_res = client.get("/api/projects")
    projects = projects_res.json()
    if not projects:
        return

    project_id = projects[0]["id"]
    papers_res = client.get(f"/api/papers?project_id={project_id}")
    papers = papers_res.json()
    if len(papers) < 2:
        return

    comp_req = {
        "project_id": project_id,
        "paper_ids": [papers[0]["id"], papers[1]["id"]],
        "research_question": "What are the trade-offs between dense representations and retrieval latency?",
        "title": "Dense vs Latency Trade-off Analysis"
    }

    res = client.post("/api/comparisons", json=comp_req)
    assert res.status_code == 201
    data = res.json()
    assert "methodology_matrix" in data
    assert "dataset_metric_matrix" in data
    assert "findings_limitations_matrix" in data
    assert "agreements" in data
    assert "disagreements" in data
    assert "synthesis_narrative" in data
    assert len(data["methodology_matrix"]) >= 2
