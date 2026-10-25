import re


def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_skills(text, skill_catalog):
    cleaned = clean_text(text)
    found = []

    for skill in skill_catalog:
        skill_clean = clean_text(skill)

        pattern = (
            r"(?<!\w)"
            + re.escape(skill_clean)
            + r"(?!\w)"
        )

        if re.search(pattern, cleaned):
            found.append(skill)

    return sorted(set(found))