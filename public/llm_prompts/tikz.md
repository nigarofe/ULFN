## Description
**Pontos**
- A (0,0)
- B (1,0.75)
- C (2,1.5)
- D (3,0.75)
- E (4,0)
- F (2,0)

**Elementos**
- Apoio móvel em A.
- Apoio fixo em E.
- Viga em AB, BC, CD, DE, EF, FA, BF, DF, CF.
- Carga pontual de 
  - 10kN em B para baixo
  - 8kN em C para direita
  - 15kN em F para baixo

Be sure to put the force F below the point F, so it does not overlap with the beam CF.

## Instructions
- The output shall be a valid TikZ code that follows the description.
- The node labels shall be in a position that does not overlap with any other element.
- The necessary dimensions shall be included in the drawing
- The output shall not include any latex delimiters (e.g. dollar signs).
- Be sure to include the shapes before referencing them in the code. For example, if you need to draw a force arrow at point B, make sure to define point B and draw the beam before drawing the force arrow.

## Example interactions
### Interaction 1
**Input**
Pontos
- A (0,0)
- B (2,0)
- C (3,0)
Elementos
- Viga em balanço entre A e C.
- Carga concentrada de 5kN aplicada em B.

**Output**
```tikz
\coordinate (A) at (0,0);
\coordinate (B) at (2,0);
\coordinate (C) at (3,0);

\node[right=6pt, below=3pt] at (A) {\textbf{A}};
\node[below=3pt] at (B) {\textbf{B}};
\node[below=3pt] at (C) {\textbf{C}};

\draw[dimension] (0,-0.8) -- (3,-0.8) node[midway, fill=white, text=black] {3 m};
\draw[dimension] (0,-1.3) -- (2,-1.3) node[midway, fill=white, text=black] {2 m};
\draw[dimension] (2,-1.3) -- (3,-1.3) node[midway, fill=white, text=black] {1 m};

\foreach \y in {-0.4, -0.2, 0, 0.2, 0.4} 
  \draw[ground hatch] (0,\y) -- (-0.2,\y+0.2);

\draw[support] (0,-0.5) -- (0,0.5);

\draw[beam] (A) -- (C);

\draw[force] (2, 0.8) -- (2, 0.05) node[midway, right=1pt] {5 kN};
```

### Interaction 2
**Input**
Pontos
- A (0,0)
- B (2,0)
- C (3,0)
Elementos
- Viga engastada em A.
- Carga uniformemente distribuída de 4kN/m entre B e C.


**Output**
```tikz
\coordinate (A) at (0,0);
\coordinate (B) at (2,0);
\coordinate (C) at (3,0);

\node[below=10pt, right=1pt] at (A) {\textbf{A}};
\node[below=5pt] at (B) {\textbf{B}};
\node[below=5pt] at (C) {\textbf{C}};

\draw[dimension] (0,-0.8) -- (3,-0.8) node[midway, fill=white, text=black] {3 m};
\draw[dimension] (0,-1.3) -- (2,-1.3) node[midway, fill=white, text=black] {2 m};
\draw[dimension] (2,-1.3) -- (3,-1.3) node[midway, fill=white, text=black] {1 m};

\draw[beam] (A) -- (C);

\draw[support] (0,-0.6) -- (0,0.6);

\draw[support] (2, 0.8) -- (3, 0.8) node[midway, above=2pt] {4 kN/m};

\foreach \y in {-0.5, -0.3, ..., 0.5} 
  \draw[ground hatch] (0,\y) -- (-0.2,\y+0.2);

\foreach \x in {2, 2.2, ..., 3}
  \draw[force] (\x, 0.8) -- (\x, 0.05);
```

### Interaction 3
**Input**
Pontos
- A (0,0)
- B (2,0)
- C (6,0)
- D (8,0)
Elementos
- Viga biapoiada entre A e D.
- Carga uniformemente distribuída de 10kN/m entre B e C.
- Momento M_0 de 30kN.m aplicado no ponto A no sentido horário.

**Output**
```tikz
\coordinate (A) at (0,0);
\coordinate (B) at (2,0);
\coordinate (C) at (6,0);
\coordinate (D) at (8,0);

\node[above right=3pt] at (A) {\textbf{A}};
\node[below=6pt] at (B) {\textbf{B}};
\node[below=6pt] at (C) {\textbf{C}};
\node[above left=3pt] at (D) {\textbf{D}};

\draw[dimension] (0,-1.2) -- (8,-1.2) node[midway, fill=white] {8 m};
\draw[dimension] (0,-1.8) -- (2,-1.8) node[midway, fill=white] {2 m};
\draw[dimension] (2,-1.8) -- (6,-1.8) node[midway, fill=white] {4 m};
\draw[dimension] (6,-1.8) -- (8,-1.8) node[midway, fill=white] {2 m};

\draw[beam] (A) -- (D);

% Fixed support
\draw[support] (A) -- (-0.3,-0.5) -- (0.3,-0.5) -- cycle;
\draw[support] (-0.5,-0.5) -- (0.5,-0.5);
\foreach \x in {-0.4, -0.2, ..., 0.4} 
  \draw[ground hatch] (\x,-0.5) -- (\x-0.15,-0.7);

% Roller support
\draw[support] (D) -- (7.7,-0.4) -- (8.3,-0.4) -- cycle;
\draw[support] (7.5,-0.48) -- (8.5,-0.48);
\filldraw[draw=black, fill=white, thick] (7.8,-0.44) circle (0.04);
\filldraw[draw=black, fill=white, thick] (8.0,-0.44) circle (0.04);
\filldraw[draw=black, fill=white, thick] (8.2,-0.44) circle (0.04);
\foreach \x in {7.6, 7.8, 8.0, 8.2, 8.4} 
  \draw[ground hatch] (\x,-0.48) -- (\x-0.15,-0.68);

\draw[force] (-0.6,0) arc[start angle=180, end angle=-30, radius=0.6] 
  node[left=10pt, above=30pt] {30 kN.m};

\draw[support] (2,1) -- (6,1) node[midway, above=2pt] {10 kN/m};
\foreach \x in {2, 2.5, ..., 6}
  \draw[force] (\x,1) -- (\x,0.05);
```