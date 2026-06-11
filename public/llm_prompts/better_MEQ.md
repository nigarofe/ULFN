- Act as an expert educational psychometrician and assessment designer with deep knowledge of constructed-response testing and the SOLO taxonomy. Your task is to generate a single higher-order Modified Essay Question (MEQ) for the subject of **SUBJECT** at the academic level of **LEVEL**.
- The output shall be in **LANGUAGE**
- Adhere strictly to every guideline below. Violating any rule invalidates the item.

# What Is a Modified Essay Question?
- An MEQ presents a realistic scenario that **unfolds progressively** through a series of sequenced, short-answer prompts. Each prompt targets a specific cognitive skill and builds on the information revealed so far — mimicking the way a practitioner encounters a problem in stages.
- Unlike a traditional essay, each sub-question is **focused and bounded**: the student writes a concise, targeted response (typically 2–6 sentences or a structured list), not a full-length essay.

# Cognitive Level
- The overall MEQ must span **at least two** of the following levels from the revised Bloom's Taxonomy: **Apply**, **Analyze**, **Evaluate**, or **Create**. State the level targeted by each sub-question in the metadata.
- Across the full item, the student must engage in multilogical thinking: integrating facts, principles, or perspectives from multiple domains rather than recalling a single isolated fact.

# Scenario Construction
- Open with a rich, contextualised scenario: a clinical vignette, case study, field observation, data set, policy dilemma, or real-world professional situation. Include enough authentic detail (demographics, measurements, timelines, stakeholder perspectives) to ground the problem.
- The scenario must be **self-contained**: all information required to attempt each sub-question is provided within the scenario text or revealed in subsequent scenario updates. No unstated assumed knowledge beyond the course content should be necessary.
- **Prohibited in the scenario:** window dressing (irrelevant details that pad length without adding cognitive demand), culturally biased or stereotyped content, and leading language that telegraphs expected answers.

# Progressive Disclosure
- After the opening scenario, present **3–5 sequenced sub-questions** (labeled Q1, Q2, Q3 …).
- Between sub-questions you may introduce a **scenario update** — new data, test results, a complication, a stakeholder response — that shifts the problem space. Clearly separate updates from sub-questions using a horizontal rule or heading.
- Sequence the sub-questions so cognitive demand **generally increases**: early prompts may ask the student to identify, list, or explain; later prompts should require the student to justify, evaluate trade-offs, propose a plan, or defend a decision.
- Each sub-question must be **independent enough** that a student who answered a prior question incorrectly can still demonstrate competence on the next one (avoid answer-chaining where a wrong Q1 makes Q2 impossible).

# Sub-Question Design
- Each sub-question must:
  - **Target exactly one cognitive task.** Compound prompts ("List X *and* explain why Y") should be split into separate sub-questions unless the conjunction is integral to the task.
  - **Specify the expected scope.** Use explicit cues such as "List three factors," "In 3–5 sentences, explain…," or "Using the data in Table 1, calculate…" to prevent students from writing too much or too little.
  - **Be answerable from the scenario plus course knowledge.** No sub-question should require information not yet disclosed.
- **Prohibited in sub-questions:** vague verbs ("Discuss," "Comment on") without a qualifier, yes/no questions without a required justification, and negative phrasing ("What should NOT be done?") unless a contrastive judgment is the explicit cognitive target.

# Output Format
- Begin the output directly with the scenario. No introductory remarks, preambles, or conversational filler.
- Structure:

```
[Opening Scenario — a detailed, realistic narrative]

**Q1.** [Sub-question text with scope cue]

---

[Optional Scenario Update — new information revealed]

**Q2.** [Sub-question text with scope cue]

---

[Optional Scenario Update]

**Q3.** [Sub-question text with scope cue]

(… continue for up to Q5)

---

## Answer Key & Rationale

**Q1** — Bloom's Level: [Apply | Analyze | Evaluate | Create]

- **Model Answer:** [A concise, exemplary response that would earn full marks.]
- **Key Marking Criteria:** [Bullet list of the essential elements a response must contain; partial-credit guidance.]
- **Common Student Errors:** [2–3 specific misconceptions or omissions students typically exhibit, with brief corrective explanations.]

**Q2** — Bloom's Level: [Apply | Analyze | Evaluate | Create]

- **Model Answer:** …
- **Key Marking Criteria:** …
- **Common Student Errors:** …

(… repeat for each sub-question)

---

**Overall Estimated Difficulty:** [Easy / Moderate / Hard] — brief justification.

**Alignment Notes:** [Which course learning outcomes or competency standards this MEQ assesses.]

```

# Variables
LANGUAGE = pt-br
SUBJECT = etapas de preparação do metal antes da trefilação
LEVEL = undergrad student
