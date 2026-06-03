# Introduction
- https://www.overleaf.com/learn/latex/Beamer


# Prompt
- The output shall be Pandoc's Markdown that can be converted to slides.
- The output shall be a single code block containing the markdown content.
- The markdown will be converted using the command `pandoc -t beamer input.md -o output.pdf` 
- The use of `---` for slide separators shall not occur.
- The slides shall be in pt-br
- The slides shall be about THEME


- The yaml front matter shall contain:
```
author: "Nicholas Gabriel Rocha Ferreira"
institute: "UFMG"
theme: "darmstadt"
colortheme: "default"
section-titles: true
logo: "../media/logo_escola_engenharia.jpg"
logooptions:
  - height=1cm
header-includes:
  - |
    \setbeamertemplate{section page}{
      \centering
      \begin{beamercolorbox}[sep=12pt,center,rounded=true,shadow=true]{title}
        \usebeamerfont{title}\insertsectionhead\par
      \end{beamercolorbox}
    }
```



- THEME = ""

- The presentation shall include an material index table using the Ashby methodology.











# Prompt melhorado


Act as an expert in Materials Engineering and Aerospace Technology. 
Generate a complete, academic presentation in Pandoc Markdown format, optimized for Beamer conversion.

# Context & Subject
- THEME: Material Selection for Low Earth Orbit Satellites: The LignoSat Case (Wood vs. Aluminum) and Ozone Layer Degradation during Atmospheric Reentry.
- Language: The generated slides MUST be strictly in Portuguese (pt-BR).

# Formatting & Output Requirements
- The output shall be a single code block containing ONLY the raw markdown content.
- Do NOT use `---` as slide separators. In Pandoc Beamer, use `#` for Section Title slides and `##` for individual slide titles.
- The slides will be converted using the command: `pandoc -t beamer input.md -o output.pdf`

# YAML Front Matter
The document must start exactly with the following YAML block (do not change the logo path):
---
title: "Seleção de Materiais Aeroespaciais"
subtitle: "O Caso LignoSat e o Combate à Degradação do Ozônio"
author: "Seu Nome"
institute: "UFMG"
theme: "darmstadt"
colortheme: "default"
section-titles: true
logo: "../media/logo_escola_engenharia.jpg"
logooptions:
  - height=1cm
---

# Content Structure & Requirements
Create a highly informative, well-paced presentation with the following structure:

1. **Introdução:** Explique o aumento da constelação de satélites em órbita baixa (LEO) e o processo de descarte na reentrada atmosférica.
2. **O Problema do Alumínio:** Detalhe como a queima de satélites tradicionais (ex: Liga de Alumínio 7075) gera óxido de alumínio ($Al_2O_3$) na estratosfera, atuando como catalisador na destruição da camada de ozônio.
3. **A Inovação do LignoSat:** Apresente a solução da Universidade de Kyoto: o uso da Madeira de Magnólia (Hoonoki).
4. **Seleção de Materiais (Metodologia de Ashby):**
   - You MUST include a markdown table comparing "Alumínio 7075" and "Madeira de Magnólia".
   - The table must act as an Ashby-style selection matrix, including columns for: Material, Densidade, Resistência no Vácuo, Resistência ao Oxigênio Atômico, e Principal Subproduto de Queima na Reentrada (Fator Ambiental crítico).
5. **Comportamento na Reentrada:** Explique por que a madeira é superior ecologicamente (queima limpa gerando apenas vapor de água e $CO_2$, sem óxidos metálicos).
6. **Conclusão:** O futuro do design sustentável na engenharia espacial.

# Tone and Style Rules
- Keep the text concise and use bullet points; do not overload the slides with massive text blocks.
- Use strict LaTeX formatting enclosed in `$` ONLY for chemical formulas (e.g., $Al_2O_3$, $H_2O$, $CO_2$). Do not use LaTeX for regular text.
- Ensure the tone is academic, suitable for a university engineering course.