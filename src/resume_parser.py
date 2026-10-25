import fitz
from docx import Document
from pathlib import Path


def extract_resume_text(file_path):
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        text_parts = []

        with fitz.open(file_path) as pdf:
            for page in pdf:
                text_parts.append(page.get_text())

        return "\n".join(text_parts).strip()

    if suffix == ".docx":
        document = Document(file_path)

        paragraphs = [
            paragraph.text
            for paragraph in document.paragraphs
        ]

        return "\n".join(paragraphs).strip()

    raise ValueError("Upload a PDF or DOCX file.")