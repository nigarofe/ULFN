# When starting a new version from scratch
1. Start Vite project
    npm create vite@latest ulf-navigator -- --template vanilla-ts
2. Design html and css structure


# Project Requirements
From more changed requirements (top) to less (bottom)


## Homepage 
- The homepage shall display a table of the Markdown files

### Homepage table
- The homepage table header shall display all the keys from the YAML frontmatter of each file, including the markdown file number as the first column
- When clicked, the homepage table rows shall direct to the dedicated file page
- The homepage table shall have a filtering and ordering section above the table

### Homepage table filtering and ordering section
- The filtering and ordering section shall allow for filtering by `Discipline` and `Exercise Classification` and ordering by markdown file number through dropdowns
- When the user selects a filtering or ordering option from the dropdown, the table shall update immediately
- When the filter is applied, the corresponding column of the table shall disappear
- The filtering and ordering shall persist if the user exits the homepage and come back
- The three dropdowns (filter by discipline, filter by exercise classification and ordering) shall be side by side; occupy equal horizontal space; occupy the same width as the table rows 
- The filtering and ordering shall be client-side and be driven by client component state using localStorage, not URL query parameters






## Markdown YAML frontmatter
- The Markdown files shall be stored in `src/content/markdown` to leverage Astro's Content Collections API
- The Markdown files shall use YAML frontmatter
- The frontmatter of Markdown files shall have it's keys aligned in columns by padding with spaces so all colons start at the same tab stop. (Note: tabs are not allowed on YAML frontmatter)
- The frontmatter of Markdown files shall always contain, and contain only
  - `Exercise Classification`
  - `Discipline`
  - `Source`
  - `Description`
- The `Exercise Classification` shall be one of
  - `Cloze`
  - `Multiple Choice`
  - `Open Ended Creation`
  - `Deterministic Problem`

```markdown
---
Exercise Classification : Multiple Choice
Discipline              : Mathematics
Source                  : Some Book, Author, Year
Description             : This is a sample description of the exercise
---
```





## Markdown images
- The images shall be stored in the `src/content/images` directory
- The images shall be referenced in the Markdown simply as `![](/ps11.jpg)`, markdown will be processed to reference the correct path
- When an image is missing it shall display an error in the webpage





## Scripts
- The scripts folder shall contain a Typescript script to check the validity of the markdown frontmatter
- The scripts folder shall contain a Typescript script that aligns columns by padding keys with multiple spaces so all colons start at the same tab stop. (Note: tabs are not allowed on YAML frontmatter)
- The scripts shall be able to be run using `npm run <script-name>`





# LLM interaction
- The system shall be chat-interface centric (to eliminate the necessity of paid API and reduce system complexity)
- The system shall provide, for each exercise classification, a prompt template to generate new exercises using a LLM, stored in `src/llm_prompts/{exerciseClassification.md}`
- The prompt templates shall be able available at a dedicated page
- The prompt templates shall each have it's corresponding button which, when pressed, copies the content of it's respective exercise classification to the clipboard

## Multiple Choice
- The LLM prompts for creating these exercises ask for "plausible distractors." It is easy for an LLM to generate one correct answer and three obviously fake ones.
