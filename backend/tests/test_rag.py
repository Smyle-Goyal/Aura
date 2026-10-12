def test_rag_query_endpoints(client):
    # 1. Fetch available seeded projects and papers
    projects_res = client.get("/api/projects")
    assert projects_res.status_code == 200
    projects = projects_res.json()
    if not projects:
        return

    project_id = projects[0]["id"]
    papers_res = client.get(f"/api/papers?project_id={project_id}")
    assert papers_res.status_code == 200
    papers = papers_res.json()
    if not papers:
        return

    paper_id = papers[0]["id"]

    # 2. Test Single-Paper Query
    single_req = {
        "paper_id": paper_id,
        "question": "What is the primary methodology introduced in this paper?",
        "top_k": 3
    }
    res_single = client.post("/api/rag/query/paper", json=single_req)
    assert res_single.status_code == 200
    data_single = res_single.json()
    assert "answer" in data_single
    assert "citations" in data_single
    assert data_single["retrieval_scope"] != ""

    # 3. Test Multi-Paper Collection Query
    multi_req = {
        "project_id": project_id,
        "question": "Compare how dense retrieval differs from traditional lexical indexing.",
        "top_k": 5
    }
    res_multi = client.post("/api/rag/query/collection", json=multi_req)
    assert res_multi.status_code == 200
    data_multi = res_multi.json()
    assert "answer" in data_multi
    assert "citations" in data_multi
    assert "confidence_assessment" in data_multi
