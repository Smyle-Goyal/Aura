import json
import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.paper import Paper, ProjectPaper, PaperChunk
from app.models.comparison import PaperComparison
from app.models.research_gap import CandidateGap
from app.models.report import ResearchReport, ResearchNote
from app.services.gemini_service import gemini_service
from app.services.qdrant_service import qdrant_service

logger = logging.getLogger(__name__)

async def seed_initial_demo_data(db: Session):
    """Populates realistic demo academic research project and papers if database is empty."""
    if db.query(Project).count() > 0:
        return

    logger.info("Database is empty. Seeding initial academic research corpus...")

    # 1. Create Default Project
    project = Project(
        id=str(uuid.uuid4()),
        title="Comparative Architectures for Retrieval-Augmented Generation",
        description="Comprehensive evaluation of dense retrieval versus hybrid indexing, long-context latency, and empirical contradiction resolution.",
        research_question="How do dense retrieval chunking configurations affect factual hallucination rates across multi-paper synthesis workflows?"
    )
    db.add(project)
    db.commit()

    # 2. Add Foundational Papers
    papers_data = [
        {
            "id": str(uuid.uuid4()),
            "title": "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
            "authors": "Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin",
            "publication_year": 2020,
            "venue": "NeurIPS",
            "doi": "10.48550/arXiv.2005.11401",
            "abstract": "Large pre-trained language models store factual knowledge in their parameters, but their ability to access and manipulate knowledge is limited. We explore retrieval-augmented generation (RAG) models, combining pre-trained parametric and non-parametric memory for language generation.",
            "chunks": [
                {
                    "page": 1,
                    "section": "Introduction",
                    "content": "Pre-trained neural language models learn substantial amounts of in-depth knowledge from data. However, they have known limitations: they cannot easily expand or mutate their memory, may struggle to precisely state their sources, and occasionally hallucinate unsupported facts."
                },
                {
                    "page": 3,
                    "section": "Methodology",
                    "content": "We combine a pre-trained sequence-to-sequence model (BART) with a dense vector index of Wikipedia passages using Dense Passage Retrieval (DPR). The non-parametric component retrieves passages based on Maximum Inner Product Search (MIPS) using top-k query embeddings."
                },
                {
                    "page": 7,
                    "section": "Limitations",
                    "content": "A key limitation of RAG-Token and RAG-Sequence is their computational overhead during decoding, as each retrieved document necessitates dedicated beam exploration. Additionally, documents with conflicting factual statements are marginalized without explicit dispute reasoning."
                }
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Dense Passage Retrieval for Open-Domain Question Answering",
            "authors": "Vladimir Karpukhin, Barlas Oğuz, Sewon Min, Patrick Lewis, Ledell Wu",
            "publication_year": 2020,
            "venue": "EMNLP",
            "doi": "10.18653/v1/2020.emnlp-main.550",
            "abstract": "Open-domain question answering relies on efficient passage retrieval to select candidate contexts. We show that retrieval can be practically implemented using dense representations learned from a dual-encoder framework.",
            "chunks": [
                {
                    "page": 2,
                    "section": "Methodology",
                    "content": "DPR utilizes two independent BERT encoders: EP(·) maps any text passage to a d-dimensional real vector, and EQ(·) maps the question. The similarity between question and passage is quantified via inner product similarity score: sim(q, p) = EQ(q)^T EP(p)."
                },
                {
                    "page": 5,
                    "section": "Experiments",
                    "content": "On Natural Questions and TriviaQA benchmarks, DPR top-20 passage retrieval recall reaches 78.4% and 79.9%, significantly outperforming the BM25 lexical baseline by up to 9-12% absolute accuracy."
                },
                {
                    "page": 8,
                    "section": "Limitations",
                    "content": "Dense bi-encoders depend critically on in-batch negative mining and hard negative selection during training. Under severe domain shifts (e.g. rare biomedical or legal entities), lexical BM25 sometimes matches or outperforms dense indexing due to exact vocabulary matching."
                }
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Lost in the Middle: How Language Models Use Long Contexts",
            "authors": "Nelson F. Liu, Kevin Lin, John Hewitt, Ashwin Paranjape, Michele Bevilacqua",
            "publication_year": 2024,
            "venue": "Transactions of the ACL",
            "doi": "10.1162/tacl_a_00638",
            "abstract": "While language models can accept increasingly long input contexts, how well do they actually utilize relevant information contained within them? We find that performance degrades significantly when key information is located in the middle of the context window.",
            "chunks": [
                {
                    "page": 2,
                    "section": "Introduction",
                    "content": "In multi-document QA tasks, models perform best when relevant information is at the very beginning or end of the input context. Performance drops sharply (U-shaped curve) when relevant facts are positioned in the middle third of lengthy prompt contexts."
                },
                {
                    "page": 4,
                    "section": "Experiments",
                    "content": "We evaluated context sizes ranging from 10 to 30 documents. As input length grows, language model accuracy systematically declines, even in extended-context LLMs claiming context capacities of 32k or 100k tokens."
                },
                {
                    "page": 7,
                    "section": "Limitations",
                    "content": "Our experiments evaluate synthetic re-rankings of documents. We do not explore iterative memory architectures or agentic multi-hop retrieval that dynamically prune distracting intermediate documents."
                }
            ]
        }
    ]

    qdrant_points = []

    for p_info in papers_data:
        paper = Paper(
            id=p_info["id"],
            title=p_info["title"],
            authors=p_info["authors"],
            publication_year=p_info["publication_year"],
            venue=p_info["venue"],
            doi=p_info["doi"],
            abstract=p_info["abstract"],
            page_count=8,
            ingestion_status="completed"
        )
        db.add(paper)
        db.add(ProjectPaper(project_id=project.id, paper_id=paper.id))
        db.commit()

        for c_idx, c_data in enumerate(p_info["chunks"]):
            chunk_id = str(uuid.uuid4())
            db_chunk = PaperChunk(
                id=chunk_id,
                paper_id=paper.id,
                chunk_index=c_idx,
                page_number=c_data["page"],
                section=c_data["section"],
                content=c_data["content"],
                token_count=len(c_data["content"].split()),
                qdrant_point_id=chunk_id
            )
            db.add(db_chunk)

            # Generate embedding vector
            emb = await gemini_service.get_embedding(c_data["content"])
            qdrant_points.append({
                "id": chunk_id,
                "vector": emb,
                "payload": {
                    "paper_id": paper.id,
                    "project_ids": [project.id],
                    "chunk_index": c_idx,
                    "page_number": c_data["page"],
                    "section": c_data["section"],
                    "content": c_data["content"],
                    "paper_title": paper.title
                }
            })

    db.commit()

    if qdrant_points:
        qdrant_service.upsert_chunks(qdrant_points)

    # 3. Add Pre-computed Seed Research Gaps
    sample_gaps = [
        {
            "title": "Cross-Document Contradiction Reconciliation in Academic RAG",
            "description": "Retrieved passages with conflicting empirical conclusions are frequently averaged or ignored by generative synthesis layers without explicit discordance mapping.",
            "category": "methodological",
            "supporting_papers": [
                {"paper_id": papers_data[0]["id"], "paper_title": papers_data[0]["title"], "page": 7, "quoted_passage": "Documents with conflicting factual statements are marginalized without explicit dispute reasoning."}
            ],
            "author_stated_limitations": [
                "Lewis et al. acknowledge that RAG generates answers without reasoning through contradictory evidence in retrieved documents."
            ],
            "conflicting_findings": [
                "Contrasting claims regarding retrieval precision between small dense chunks and full-document contexts."
            ],
            "significance_rationale": "High-stakes research depends on explicit awareness of when published literature disagrees.",
            "candidate_research_questions": [
                "Can formal graph-of-thought discourse models detect and surface empirical contradictions before generating conclusions?"
            ],
            "testable_hypotheses": [
                "Hypothesis: Contradiction-aware re-ranking reduces ungrounded consensus claims by >35%."
            ],
            "suggested_experiments": [
                "Benchmark on controversial medical or climate literature disputes and compare standard RAG vs dispute-graph synthesis."
            ],
            "potential_metrics": ["Contradiction Detection F1", "False Consensus Rate"],
            "evidence_strength": "strong",
            "evidence_justification": "Directly grounded in Lewis et al. author limitations.",
            "uncertainty_rating": "low",
            "review_status": "promising"
        },
        {
            "title": "Mitigating 'Lost-in-the-Middle' Position Bias in Multi-Paper Synthesis",
            "description": "Language models disproportionately neglect critical supporting evidence located in the middle of large context windows, skewing multi-paper reviews.",
            "category": "evaluation",
            "supporting_papers": [
                {"paper_id": papers_data[2]["id"], "paper_title": papers_data[2]["title"], "page": 2, "quoted_passage": "Performance drops sharply (U-shaped curve) when relevant facts are positioned in the middle third of lengthy prompt contexts."}
            ],
            "author_stated_limitations": [
                "Liu et al. explicitly note that naive document concatenation creates systematic retrieval blind spots."
            ],
            "conflicting_findings": [],
            "significance_rationale": "Researchers reviewing dozens of papers may miss vital methodologies buried midway through long context prompts.",
            "candidate_research_questions": [
                "Does query-aware dynamic re-centering of passages eliminate the U-shaped degradation curve?"
            ],
            "testable_hypotheses": [
                "Hypothesis: Dynamic bidirectional interleaving restores middle-passage recall within 5% of boundary recall."
            ],
            "suggested_experiments": [
                "Test synthetic multi-hop academic questions with evidence permuted systematically across 30 documents."
            ],
            "potential_metrics": ["Position-Invariant Recall@k", "Mean Reciprocal Rank Decay"],
            "evidence_strength": "strong",
            "evidence_justification": "Directly substantiated by empirical findings in Liu et al. (TACL 2024).",
            "uncertainty_rating": "low",
            "review_status": "investigating"
        }
    ]

    for g_info in sample_gaps:
        gap = CandidateGap(
            project_id=project.id,
            title=g_info["title"],
            description=g_info["description"],
            category=g_info["category"],
            supporting_papers=json.dumps(g_info["supporting_papers"]),
            author_stated_limitations=json.dumps(g_info["author_stated_limitations"]),
            conflicting_findings=json.dumps(g_info["conflicting_findings"]),
            significance_rationale=g_info["significance_rationale"],
            candidate_research_questions=json.dumps(g_info["candidate_research_questions"]),
            testable_hypotheses=json.dumps(g_info["testable_hypotheses"]),
            suggested_experiments=json.dumps(g_info["suggested_experiments"]),
            potential_metrics=json.dumps(g_info["potential_metrics"]),
            evidence_strength=g_info["evidence_strength"],
            evidence_justification=g_info["evidence_justification"],
            uncertainty_rating=g_info["uncertainty_rating"],
            review_status=g_info["review_status"]
        )
        db.add(gap)

    # 4. Add Initial Research Note
    note = ResearchNote(
        project_id=project.id,
        paper_id=papers_data[0]["id"],
        title="Key Architectural Note: Non-Parametric Memory Coupling",
        content="Lewis et al. confirm that coupling parametric pre-training with dense non-parametric vector retrieval dramatically reduces factual hallucination, but requires robust boundary chunking to avoid cutting off qualifying statements.",
        tags="RAG, Architecture, DPR"
    )
    db.add(note)

    # 5. Add Initial Comprehensive Report
    report = ResearchReport(
        project_id=project.id,
        title="Systematic Review: Dense Retrieval Trade-offs and Context Window Biases",
        abstract="An evidence-grounded comparative review of dense bi-encoder indexing and position-dependent context attenuation in academic research copilots.",
        content_markdown=(
            "# Systematic Review: Dense Retrieval Trade-offs and Context Window Biases\n\n"
            "## Executive Summary\n"
            "This review synthesizes findings across foundational dense retrieval and long-context evaluation literature. "
            "Evidence indicates that while dense bi-encoders (DPR) achieve substantially higher top-k recall than lexical baselines, "
            "downstream generative performance is heavily bottlenecked by middle-passage context degradation and an absence of contradiction-aware synthesis.\n\n"
            "## 1. Retrieval Grounding & Methodological Comparison\n"
            "- **DPR (Karpukhin et al., 2020)**: Reaches 78.4% top-20 recall on Natural Questions, outperforming BM25 by up to 12%.\n"
            "- **RAG (Lewis et al., 2020)**: Establishes parametric + non-parametric memory integration with BART + DPR.\n\n"
            "## 2. Identified Research Gaps\n"
            "1. **Contradiction Reconciliation**: Standard models fail when evidence directly conflicts across studies.\n"
            "2. **Lost in the Middle**: Position bias leads models to ignore evidence in middle context positions.\n\n"
            "## Traceable References\n"
            "- Lewis et al. (NeurIPS 2020), *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*\n"
            "- Karpukhin et al. (EMNLP 2020), *Dense Passage Retrieval for Open-Domain Question Answering*\n"
            "- Liu et al. (TACL 2024), *Lost in the Middle: How Language Models Use Long Contexts*"
        )
    )
    db.add(report)

    db.commit()
    logger.info("Successfully seeded academic demo project with 3 papers and research artifacts.")
