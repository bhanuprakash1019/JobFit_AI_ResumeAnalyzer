# JobFit AI matching and requirement-card fix

## What changed
- Preserved the six requirement-analysis cards and existing dark UI.
- Requirement-card status and coverage still count job-description terms evidenced in the resume.
- The “Detected in resume” line now separately lists all tracked terms found in the resume for that category, even when a term is not required by the current job description. For example, Python, SQL, Excel, Power BI, Git, and GitHub can appear in the tools card when present in the resume.
- Expanded tracked terms for common resume evidence such as Artificial Intelligence, DAX, data modeling, Star Schema, Flask, HTML, CSS, Jinja2, and MySQL.
- Preserved the matched skills, potential gaps, and learning roadmap sections.
- Streamlit `app.py` remains unchanged.

## Run
1. Stop any old server with Ctrl+C.
2. Extract this ZIP into a new folder and open the `JobFitAI` folder in VS Code.
3. Install dependencies if needed: `python -m pip install -r requirements.txt`.
4. Run `python web_app.py` from this folder.
5. Open http://127.0.0.1:5000 and force refresh with Ctrl+F5.

Important: the match score is a keyword-based estimate, not a probability of rejection. A term missing from the resume text does not prove the candidate lacks that skill.
