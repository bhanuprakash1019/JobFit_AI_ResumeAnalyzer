
const form = document.querySelector("#analyze-form");
const fileInput = document.querySelector("#resume");
const dropZone = document.querySelector("#drop-zone");
const fileTitle = document.querySelector("#file-title");
const fileSubtitle = document.querySelector("#file-subtitle");
const analyzeButton = document.querySelector("#analyze-button");
const formError = document.querySelector("#form-error");
const loadingPanel = document.querySelector("#loading-panel");
const resultsSection = document.querySelector("#results");

let latestReport = null;
let progressTimer = null;
let analysisProgress = 0;

function setFile(file) {
  if (!file) return;

  const extension = file.name.split(".").pop().toLowerCase();
  if (!["pdf", "docx"].includes(extension)) {
    formError.textContent = "Please choose a PDF or DOCX file.";
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    formError.textContent = "The maximum file size is 10 MB.";
    return;
  }

  // Assign the dropped file to the native file input.
  const transfer = new DataTransfer();
  transfer.items.add(file);
  fileInput.files = transfer.files;

  fileTitle.textContent = file.name;
  fileSubtitle.textContent =
    `${(file.size / 1024).toFixed(1)} KB · Ready to analyze`;
  formError.textContent = "";
  dropZone.classList.add("dragover");
  setTimeout(() => dropZone.classList.remove("dragover"), 350);
}

fileInput.addEventListener("change", () => {
  setFile(fileInput.files[0]);
});

["dragenter", "dragover"].forEach(eventName => {
  dropZone.addEventListener(eventName, event => {
    event.preventDefault();
    dropZone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach(eventName => {
  dropZone.addEventListener(eventName, event => {
    event.preventDefault();
    dropZone.classList.remove("dragover");
  });
});

dropZone.addEventListener("drop", event => {
  setFile(event.dataTransfer.files[0]);
});

function showSkills(containerId, skills, type) {
  const container = document.getElementById(containerId);
  container.replaceChildren();

  if (!skills || skills.length === 0) {
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = type === "match"
      ? "No skills were detected in both the resume and job description."
      : "No potential skill gaps were detected.";
    container.appendChild(message);
    return;
  }

  skills.forEach((skill, index) => {
    const chip = document.createElement("span");
    chip.className = `skill-chip ${type}`;
    chip.textContent = `${type === "match" ? "✓" : "✧"} ${skill}`;
    chip.style.animationDelay = `${Math.min(index * 45, 450)}ms`;
    container.appendChild(chip);
  });
}

function animateScore(target) {
  const ring = document.getElementById("score-ring");
  const value = document.getElementById("score-value");
  if (target === null || target === undefined || !Number.isFinite(Number(target))) {
    value.textContent = "N/A";
    ring.style.setProperty("--score", "0%");
    return;
  }
  target = Math.max(0, Math.min(100, Number(target)));
  const start = performance.now();
  const duration = 1000;

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(target * eased);

    value.textContent = `${current}%`;
    ring.style.setProperty("--score", `${current}%`);

    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function renderRecommendations(items) {
  const container = document.getElementById("recommendation-list");
  container.replaceChildren();

  if (!items || items.length === 0) {
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent =
      "No roadmap items could be generated. Review the listed gaps and add truthful evidence where applicable.";
    container.appendChild(message);
    return;
  }

  items.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "recommendation-card";
    card.style.animationDelay = `${Math.min(index * 70, 500)}ms`;

    const meta = document.createElement("div");
    meta.className = "recommendation-meta";

    [item.category, `Priority: ${item.priority}`].forEach(label => {
      const tag = document.createElement("span");
      tag.className = "mini-tag";
      tag.textContent = label;
      meta.appendChild(tag);
    });

    const title = document.createElement("h3");
    title.textContent = item.skill;

    const description = document.createElement("p");
    description.textContent = item.suggestion;

    card.append(meta, title, description);
    container.appendChild(card);
  });
}

function renderModel(model) {
  const container = document.getElementById("model-output");
  container.replaceChildren();

  const message = document.createElement("p");

  if (model.available) {
    message.textContent = `Experimental class label: ${model.label}`;
  } else {
    message.textContent =
      "A model prediction is unavailable. The skill-gap analysis is still available.";
  }

  container.appendChild(message);

  if (model.available && model.scores?.length) {
    model.scores.forEach(item => {
      const row = document.createElement("div");
      row.className = "score-bar-row";

      const label = document.createElement("span");
      label.textContent = `Class ${item.class}`;

      const bar = document.createElement("div");
      bar.className = "score-bar";

      const fill = document.createElement("i");
      fill.style.width = `${Math.max(0, Math.min(100, item.score))}%`;
      bar.appendChild(fill);

      const score = document.createElement("b");
      score.textContent = `${item.score}%`;

      row.append(label, bar, score);
      container.appendChild(row);
    });
  }

  const notice = document.createElement("p");
  notice.textContent = model.notice;
  container.appendChild(notice);
}


function renderRequirementAnalysis(analysis) {
  const summary = document.getElementById("requirement-summary");
  const categoriesContainer = document.getElementById("requirement-categories");
  const reasonsContainer = document.getElementById("rejection-reasons");
  if (!summary || !categoriesContainer || !reasonsContainer) return;
  summary.replaceChildren();
  categoriesContainer.replaceChildren();
  reasonsContainer.replaceChildren();

  const coverage = document.createElement("div");
  coverage.className = "requirement-coverage";
  const title = document.createElement("strong");
  title.textContent = analysis.tracked_requirement_terms
    ? `Tracked job-description terms detected: ${analysis.detected_requirement_terms}/${analysis.tracked_requirement_terms} (${analysis.requirement_coverage_percent}%)`
    : "Not enough known requirement terms were found to calculate coverage.";
  coverage.appendChild(title);
  if (analysis.tracked_requirement_terms) {
    const track = document.createElement("div");
    track.className = "coverage-track";
    const fill = document.createElement("i");
    fill.style.width = `${Math.max(0, Math.min(100, analysis.requirement_coverage_percent))}%`;
    track.appendChild(fill);
    coverage.appendChild(track);
  }
  summary.appendChild(coverage);

  (analysis.categories || []).forEach(item => {
    const card = document.createElement("article");
    card.className = "requirement-card";
    const heading = document.createElement("h3");
    heading.textContent = item.category;
    const status = document.createElement("span");
    status.className = "requirement-status " + (
      item.status === "Matched" ? "status-match" :
      item.status === "Partially matched" ? "status-partial" : "status-missing"
    );
    status.textContent = item.status;
    const detail = document.createElement("p");
    detail.textContent = item.explanation;
    const found = document.createElement("p");
    found.className = "requirement-detail";
    const resumeTerms = item.detected_in_resume || item.detected || [];
    found.textContent = "Detected in resume: " + (resumeTerms.length ? resumeTerms.join(", ") : "No tracked terms detected");
    const review = document.createElement("p");
    review.className = "requirement-detail";
    review.textContent = "Requirements to review: " + (item.requirements_review.length ? item.requirements_review.join(", ") : "None from this tracked group");
    card.append(heading, status, detail, found, review);
    categoriesContainer.appendChild(card);
  });

  (analysis.potential_rejection_reasons || []).forEach(item => {
    const card = document.createElement("article");
    card.className = "rejection-card";
    const heading = document.createElement("h3");
    heading.textContent = `${item.category} — ${item.priority} priority`;
    const reason = document.createElement("p");
    reason.textContent = item.reason;
    const gaps = document.createElement("p");
    gaps.className = "requirement-detail";
    gaps.textContent = "Review: " + item.requirements_to_review.join(", ");
    const advice = document.createElement("p");
    advice.textContent = item.improvement;
    card.append(heading, reason, gaps, advice);
    reasonsContainer.appendChild(card);
  });
  if (!(analysis.potential_rejection_reasons || []).length) {
    const noGaps = document.createElement("p");
    noGaps.textContent = "No gaps were detected in the tracked groups. This does not prove the resume meets every job requirement; review the job description manually.";
    reasonsContainer.appendChild(noGaps);
  }
  document.getElementById("requirement-disclaimer").textContent = analysis.note || "";
}


function renderResults(data) {
  latestReport = data;

  document.getElementById("summary-text").textContent = data.summary;
  document.getElementById("matched-count").textContent =
    data.matched_item_count ?? data.matched_skills.length;
  document.getElementById("missing-count").textContent =
    data.potential_gap_count ?? data.missing_skills.length;
  document.getElementById("score-heading").textContent =
    data.skill_match_percent === null ? "Insufficient evidence" : "Job requirement coverage";

  animateScore(data.skill_match_percent);
  if (data.skill_score_warning) {
    document.getElementById("summary-text").textContent =
      `${data.summary} ${data.skill_score_warning}`;
  }
  if (data.requirement_analysis) renderRequirementAnalysis(data.requirement_analysis);
  const matchedDisplayItems = [
    ...(data.matched_skills || []),
    ...((data.matched_requirement_terms || []).map(item => `${item.category}: ${item.term}`))
  ];
  showSkills("matched-skills", [...new Set(matchedDisplayItems)], "match");
  // Prefer broader JD requirements over the smaller catalog-only missing list.
  showSkills("missing-skills", data.potential_gaps ?? data.missing_skills, "gap");
  renderRecommendations(data.recommendations);
  renderModel(data.model);

  resultsSection.classList.remove("hidden");
  resultsSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function updateAnalysisProgress(value, stageText) {
  analysisProgress = Math.max(0, Math.min(100, Math.round(value)));
  const percent = document.getElementById("loading-percent");
  const fill = document.getElementById("loading-progress-fill");
  const track = document.querySelector(".loading-track[role='progressbar']");
  const stage = document.getElementById("loading-stage");
  if (percent) percent.textContent = `${analysisProgress}%`;
  if (fill) fill.style.width = `${analysisProgress}%`;
  if (track) track.setAttribute("aria-valuenow", String(analysisProgress));
  if (stage && stageText) stage.textContent = stageText;
  const activeStage = analysisProgress < 28 ? 0 : analysisProgress < 55 ? 1 : analysisProgress < 80 ? 2 : 3;
  document.querySelectorAll(".loading-stage").forEach((item, index) => {
    item.classList.toggle("active", index === activeStage);
    item.classList.toggle("complete", index < activeStage || analysisProgress === 100);
  });
}


function startAnalysisProgress() {
  clearInterval(progressTimer);

  analysisProgress = 0;
  updateAnalysisProgress(3, "Preparing your resume and job description…");

  const messages = [
    { at: 8, text: "Extracting resume content and experience…" },
    { at: 30, text: "Reviewing the job requirements…" },
    { at: 55, text: "Matching skills and evidence across both documents…" },
    { at: 75, text: "Building your personalized learning roadmap…" },
    { at: 88, text: "Finalizing your analysis…" }
  ];

  progressTimer = setInterval(() => {
    // Progress slows down gradually and never reaches 100% here.
    const current = analysisProgress;
    let increment;

    if (current < 25) {
      increment = 1.0;
    } else if (current < 50) {
      increment = 0.6;
    } else if (current < 75) {
      increment = 0.35;
    } else {
      increment = 0.15;
    }

    const next = Math.min(92, current + increment);
    const message = [...messages]
      .reverse()
      .find(item => next >= item.at);

    updateAnalysisProgress(
      next,
      message
        ? message.text
        : "Preparing your resume for analysis…"
    );
  }, 700);
}


form.addEventListener("submit", async event => {
  event.preventDefault();
  formError.textContent = "";

  const file = fileInput.files[0];
  const description =
    document.getElementById("job-description").value.trim();

  if (!file) {
    formError.textContent = "Upload your resume first.";
    return;
  }

  if (!description) {
    formError.textContent = "Enter the job description first.";
    return;
  }

  const payload = new FormData(form);

  analyzeButton.disabled = true;
  analyzeButton.classList.add("busy");
  loadingPanel.classList.remove("hidden");
  loadingPanel.classList.add("loading-active");
  resultsSection.classList.add("hidden");
  startAnalysisProgress();

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      body: payload
  });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Analysis failed.");
    }

    clearInterval(progressTimer);
    updateAnalysisProgress(100, "Analysis complete. Your results are ready.");
    await new Promise(resolve => setTimeout(resolve, 280));
    renderResults(data);
  } catch (error) {
    formError.textContent =
      error.message || "Could not connect to the Flask server.";
  }finally {
    clearInterval(progressTimer);

    loadingPanel.classList.add("hidden");
    loadingPanel.classList.remove("loading-active");

    analyzeButton.disabled = false;
    analyzeButton.classList.remove("busy");
}
});

document.getElementById("download-report").addEventListener("click", () => {
  if (!latestReport) return;

  const lines = [
    "JOBFIT AI — RESUME ANALYSIS",
    `Resume: ${latestReport.filename}`,
    `Job requirement coverage: ${latestReport.skill_match_percent == null ? "Insufficient evidence" : latestReport.skill_match_percent + "%"}`,
    "",
    "MATCHED SKILLS",
    ...latestReport.matched_skills.map(skill => `- ${skill}`),
    "",
    "POTENTIAL SKILL GAPS",
    ...(latestReport.potential_gaps || latestReport.missing_skills || []).map(skill => `- ${skill}`),
    "",
    "LEARNING RECOMMENDATIONS",
    ...latestReport.recommendations.map(
      item => `- ${item.skill}: ${item.suggestion}`
    ),
    "",
    "EXPERIMENTAL MODEL",
    latestReport.model.notice,
    `Analysis timing: ${latestReport.analysis_timings?.total_seconds ?? "unknown"} seconds total; resume parsing ${latestReport.analysis_timings?.resume_parse_seconds ?? "unknown"} seconds.`,
    "",
    "Disclaimer: Text matching does not establish actual proficiency. "
      + "The model uses synthetic demonstration data and is not a "
      + "validated rejection probability."
  ];

  const blob = new Blob([lines.join("\n")], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "jobfit_analysis.txt";
  link.click();
  URL.revokeObjectURL(url);
});
