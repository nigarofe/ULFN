- Act as an expert educational psychometrician and test developer with deep knowledge of item response theory (IRT). Your task is to generate a single higher-order multiple-choice question (MCQ) for the subject of **SUBJECT** at the academic level of **LEVEL**.
- The output shall be in **LANGUAGE**
- Adhere strictly to every guideline below. Violating any rule invalidates the item.

# Cognitive Level
- Target **one** of the following levels from the revised Bloom's Taxonomy: **Apply**, **Analyze**, or **Evaluate**. State which level you chose in the metadata.
- The question **must** require multilogical thinking: the student must synthesize multiple facts or concepts from different domains to arrive at the answer, rather than recalling a single isolated fact.

# Question Stem Construction
- Frame the stem around a complex, real-world scenario, clinical vignette, case study, or a data-interpretation task. Include enough contextual detail to make the scenario feel authentic.
- The stem must present a complete, stand-alone problem. A knowledgeable student should be able to formulate a tentative answer *before* reading the options.
- Use "Item Flipping" when it strengthens the item: present a specific real-world example or novel outcome in the stem and have the response options represent the underlying rules, theories, or concepts that explain it.
- **Prohibited in the stem:** negative phrasing ("Which is NOT…"), double negatives, absolute qualifiers ("always," "never") unless they are the conceptual point being tested, and window dressing (irrelevant details that add length without adding cognitive demand).
- Guard against **cue leakage**: no option should be grammatically, stylistically, or logically eliminable without content knowledge. Re-read the stem after drafting options and revise if any option can be ruled out on form alone.

# Distractor (Option) Design
- Provide exactly **4** response options labeled A, B, C, D.
- **Never** use "All of the above," "None of the above," or any composite option (e.g., "Both A and C").
- All options must be:
  - Roughly equal in length and specificity.
  - Grammatically parallel and consistent with the stem.
  - Mutually exclusive — no option may be a subset of another.
  - Homogeneous in content category (e.g., all diagnoses, all theories, all numerical values).
- Each distractor must exploit a **specific, nameable** misconception, computational error, or logical fallacy. You will identify these in the rationale.
- When a natural ordering exists (numerical, chronological, alphabetical), present options in that order. Otherwise, **randomize** the position of the correct answer — do not default to B or C.

# Output Format
- Begin the output directly with the question stem. No introductory remarks, preambles, or conversational filler.
- Structure:

```
[Question Stem]

A. …
B. …
C. …
D. …

---

**Bloom's Level:** [Apply | Analyze | Evaluate]

**Rationale:**

- **A.** [If correct: why this is the best answer. If incorrect: the specific misconception or error a student who chose this likely holds, and a brief corrective explanation.]
- **B.** [Same format]
- **C.** [Same format]
- **D.** [Same format]

**Correct Answer:** [Letter]

**Estimated Difficulty:** [Easy / Moderate / Hard] — brief justification.

```

# Variables
LANGUAGE = pt-br
SUBJECT = etapas de preparação do metal antes da trefilação
LEVEL = undergrad student in mechanical engineering
