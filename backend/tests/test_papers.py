import io
import pytest
from app.services.ingestion_service import ingestion_service

def test_paper_upload_validation(client):
    # Test rejecting invalid file type
    invalid_file = io.BytesIO(b"Just plain text file content")
    res = client.post(
        "/api/papers/upload",
        files={"file": ("notes.txt", invalid_file, "text/plain")}
    )
    assert res.status_code == 400
    assert "PDF document" in res.json()["detail"]

    # Test rejecting non-PDF magic bytes
    bad_pdf = io.BytesIO(b"Not a real PDF header")
    res2 = client.post(
        "/api/papers/upload",
        files={"file": ("fake.pdf", bad_pdf, "application/pdf")}
    )
    assert res2.status_code == 400
    assert "signature" in res2.json()["detail"].lower()

def test_text_chunking_and_section_detection():
    sample_text = (
        "Abstract\n"
        "We propose a novel attention mechanism that balances memory and speed.\n\n"
        "Introduction\n"
        "Deep learning models require vast context windows.\n\n"
        "Methodology\n"
        "Our architecture uses dual-stream attention to separate query and key representations.\n\n"
        "Limitations\n"
        "The model requires 2x memory during backward pass."
    )
    chunks = ingestion_service.chunk_text(sample_text, page_num=1, start_section="Abstract")
    assert len(chunks) >= 1
    assert any("Abstract" in c["section"] or "Introduction" in c["section"] or "Methodology" in c["section"] for c in chunks)
    assert chunks[0]["page_number"] == 1
    assert "content" in chunks[0]
