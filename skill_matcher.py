import re

# Canonical skill names and common spellings/aliases. Extend this list as needed.
SKILL_ALIASES = {
    "Python": ["python"],
    "SQL": ["sql", "structured query language"],
    "Machine Learning": ["machine learning", "ml"],
    "Generative AI": ["generative ai", "genai", "gen ai", "generative artificial intelligence"],
    "Artificial Intelligence": ["artificial intelligence", "ai"],
    "Deep Learning": ["deep learning"],
    "Natural Language Processing": ["natural language processing", "nlp"],
    "Large Language Models": ["large language model", "large language models", "llm", "llms"],
    "RAG": ["rag", "retrieval augmented generation", "retrieval-augmented generation"],
    "Azure": ["azure", "microsoft azure"],
    "AWS": ["aws", "amazon web services"],
    "Google Cloud": ["google cloud", "gcp"],
    "Docker": ["docker"],
    "Kubernetes": ["kubernetes", "k8s"],
    "CI/CD": ["ci/cd", "continuous integration", "continuous delivery", "continuous deployment"],
    "MLOps": ["mlops", "machine learning operations"],
    "Flask": ["flask"],
    "Django": ["django"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
    "TensorFlow": ["tensorflow"],
    "PyTorch": ["pytorch"],
    "Power BI": ["power bi", "powerbi"],
    "Tableau": ["tableau"],
    "Excel": ["excel", "microsoft excel"],
    "MySQL": ["mysql"],
    "PostgreSQL": ["postgresql", "postgres"],
    "Git": ["git"],
    "GitHub": ["github"],
    "Statistics": ["statistics", "statistical analysis"],
    "Data Visualization": ["data visualization", "data visualisation"],
    "ETL": ["etl", "extract transform load"],
    "Leadership": ["leadership", "team leadership", "team management", "mentoring"],
    "Stakeholder Management": ["stakeholder management", "stakeholder engagement", "stakeholders"],
    "Deployment": ["deployment", "deploy", "deployed", "production deployment"],
}


def _normalise(text):
    text = str(text or "").casefold().replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", text).strip()


def _has_phrase(text, phrase):
    text = _normalise(text)
    phrase = _normalise(phrase)
    # Word boundaries stop short skills (e.g. R, AI) matching inside unrelated words.
    return bool(re.search(r"(?<![a-z0-9])" + re.escape(phrase) + r"(?![a-z0-9])", text))


def detect_skills(text, extra_skills=None):
    """Return canonical skills evidenced in text, independently of the learning catalog."""
    found = []
    for canonical, aliases in SKILL_ALIASES.items():
        if any(_has_phrase(text, alias) for alias in aliases):
            found.append(canonical)
    for skill in extra_skills or []:
        label = str(skill).strip()
        if label and label not in found and _has_phrase(text, label):
            found.append(label)
    return found


def analyze_skill_gap(resume_skills, required_skills):
    """Compare canonicalized skill labels and return match/gap counts and score."""
    alias_to_canonical = {}
    for canonical, aliases in SKILL_ALIASES.items():
        alias_to_canonical[_normalise(canonical)] = canonical
        for alias in aliases:
            alias_to_canonical[_normalise(alias)] = canonical

    def canonicalise(items):
        output = {}
        for item in items or []:
            label = str(item).strip()
            if not label:
                continue
            key = _normalise(label)
            output[alias_to_canonical.get(key, label)] = alias_to_canonical.get(key, label)
        return output

    resume = canonicalise(resume_skills)
    required = canonicalise(required_skills)
    matched = sorted(set(resume) & set(required), key=str.casefold)
    missing = sorted(set(required) - set(resume), key=str.casefold)
    score = round(len(matched) / len(required) * 100, 1) if required else None
    return {
        "matched_skills": matched,
        "missing_skills": missing,
        "match_score": score,
        "required_skill_count": len(required),
        "matched_skill_count": len(matched),
        "score_warning": "" if len(required) >= 3 else "Too few distinct job skills were detected for a reliable percentage; review the full job requirements."
    }
