def test_research_gaps_engine(client):
    projects_res = client.get("/api/projects")
    projects = projects_res.json()
    if not projects:
        return

    project_id = projects[0]["id"]

    # 1. List existing candidate gaps
    res_list = client.get(f"/api/gaps?project_id={project_id}")
    assert res_list.status_code == 200
    gaps = res_list.json()
    assert len(gaps) > 0

    gap = gaps[0]
    gap_id = gap["id"]
    assert "title" in gap
    assert "category" in gap
    assert "supporting_papers" in gap
    assert "testable_hypotheses" in gap
    assert "evidence_strength" in gap
    assert "review_status" in gap

    # 2. Update review decision
    review_req = {
        "decision": "promising",
        "reviewer_note": "Crucial empirical direction for our team to pursue in Q4."
    }
    res_review = client.put(f"/api/gaps/{gap_id}/review", json=review_req)
    assert res_review.status_code == 200
    reviewed = res_review.json()
    assert reviewed["review_status"] == "promising"
    assert "Q4" in reviewed["user_notes"]

    # 3. Test filtering
    res_filter = client.get(f"/api/gaps?project_id={project_id}&review_status=promising")
    assert res_filter.status_code == 200
    assert any(g["id"] == gap_id for g in res_filter.json())
