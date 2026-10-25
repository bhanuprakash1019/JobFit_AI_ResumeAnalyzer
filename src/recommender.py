from pathlib import Path
import pandas as pd

FALLBACK_ROADMAP = {
    "python": ("Programming", "High", "Practise Python fundamentals, functions, collections, file handling, and writing clean reusable code. Build a small data-processing project."),
    "sql": ("Data", "High", "Practise SELECT, JOIN, GROUP BY, subqueries, CTEs, and window functions using a sample database."),
    "machine learning": ("AI/ML", "High", "Build a supervised ML project covering preprocessing, train/test split, evaluation metrics, and error analysis."),
    "generative ai": ("AI/ML", "High", "Learn prompting, embeddings, vector search, RAG, evaluation, and safe handling of model outputs. Build a document Q&A demo."),
    "azure": ("Cloud", "High", "Learn Azure fundamentals, identity/access control, storage, and Azure AI services. Deploy a small demo only after practising locally."),
    "aws": ("Cloud", "High", "Learn AWS fundamentals, IAM, S3, and one deployment path. Deploy a small application with appropriate access controls."),
    "google cloud": ("Cloud", "Medium", "Learn core Google Cloud concepts, IAM, storage, and a basic application deployment workflow."),
    "ci/cd": ("DevOps", "High", "Create a GitHub Actions workflow that runs tests and linting on each push; then practise a safe deployment pipeline."),
    "mlops": ("MLOps", "High", "Learn experiment tracking, model versioning, reproducible pipelines, monitoring, and drift checks."),
    "deployment": ("Deployment", "High", "Package a small Flask or ML application, configure environment variables, add tests, and deploy it to a test environment."),
    "leadership": ("Professional skills", "Medium", "Practise writing project plans, documenting decisions, giving clear status updates, and describing your actual contribution. Do not claim management experience you have not had."),
    "stakeholder management": ("Communication", "Medium", "Practise gathering requirements, summarizing trade-offs, and presenting outcomes to technical and non-technical audiences."),
    "docker": ("DevOps", "Medium", "Containerize a small Python application, define dependencies, and learn images, containers, ports, and volumes."),
    "kubernetes": ("DevOps", "Medium", "Learn pods, deployments, services, and configuration concepts after becoming comfortable with containers."),
    "rag": ("AI/ML", "High", "Build a retrieval-augmented generation prototype using chunking, embeddings, retrieval, citations, and a small evaluation set."),
    "large language models": ("AI/ML", "High", "Learn tokenization, context windows, inference parameters, evaluation, and limitations of LLMs."),
    "natural language processing": ("AI/ML", "Medium", "Practise text cleaning, tokenization, vectorization, classification, and evaluation on a small text dataset."),
    "power bi": ("Analytics", "Medium", "Build a dashboard with data cleaning, a simple data model, measures, and clearly labeled insights."),
    "tableau": ("Analytics", "Medium", "Build an interactive dashboard and practise filters, calculated fields, and explaining the key insights."),
    "excel": ("Analytics", "Medium", "Practise lookups, pivot tables, conditional formatting, and data cleaning on a realistic dataset."),
    "statistics": ("Analytics", "Medium", "Review distributions, sampling, confidence intervals, hypothesis tests, and how to choose evaluation metrics."),
    "data visualization": ("Analytics", "Medium", "Practise selecting appropriate charts, labeling axes, avoiding misleading scales, and writing concise takeaways."),
}


def recommend_skills(missing_skills, catalog_path):
    """Return catalog suggestions when available, plus fallback steps for unmatched gaps."""
    missing = [str(skill).strip() for skill in (missing_skills or []) if str(skill).strip()]
    catalog = pd.DataFrame()
    path = Path(catalog_path) if catalog_path else None
    if path and path.exists():
        try:
            catalog = pd.read_csv(path).fillna("")
        except Exception:
            catalog = pd.DataFrame()

    by_skill = {}
    if not catalog.empty and "skill" in catalog.columns:
        for _, row in catalog.iterrows():
            key = str(row.get("skill", "")).strip().casefold()
            if key:
                by_skill[key] = row

    results = []
    priority_order = {"high": 0, "medium": 1, "low": 2}
    for skill in missing:
        row = by_skill.get(skill.casefold())
        if row is not None:
            results.append({
                "skill": skill,
                "category": str(row.get("category", "General") or "General"),
                "priority": str(row.get("priority", "Medium") or "Medium"),
                "suggestion": str(row.get("learning_suggestion", "") or "Practise this topic in a small project and document the outcome."),
                "source": "catalog",
            })
            continue
        info = FALLBACK_ROADMAP.get(skill.casefold())
        if info:
            category, priority, suggestion = info
        else:
            category, priority, suggestion = (
                "Requirement review", "Medium",
                f"Review the job description's requirement '{skill}'. If it applies to your experience, add truthful evidence and a project or example. Otherwise, learn the fundamentals and practise a small relevant task."
            )
        results.append({"skill": skill, "category": category, "priority": priority, "suggestion": suggestion, "source": "fallback"})

    results.sort(key=lambda item: priority_order.get(item["priority"].casefold(), 3))
    return results
