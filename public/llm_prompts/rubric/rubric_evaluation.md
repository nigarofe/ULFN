The output shall be in pt-br
The output shall be in a code block
The output shall be the evaluation of the STUDENT_RESPONSE for the STUDENT_PROMPT following the RUBRIC

The evaluation shall have the following format
```Markdown
**Avaliação da iteração [timestamp] - Nota final = X/Y**
[fill here the justification for the final score]

**Critério 1 - [fill here the criterion name] - Nota parcial = X/Y**
[fill here the justification for the partial score]

**Critério 2 - [fill here the criterion name] - Nota parcial = X/Y**
[fill here the justification for the partial score]
...

```



RUBRIC = """
## Evaluation Rubric
**Critério 1 - Citação dos Procedimentos**
- (0 pontos). O aluno não cita procedimentos válidos para a melhoria de propriedades mecânicas ou cita processos que não se aplicam a produtos fundidos.
- (1 ponto). O aluno cita apenas um procedimento aplicável ou lista múltiplos procedimentos de forma incompleta, genérica ou misturada com métodos incorretos.
- (2 pontos). O aluno cita uma variedade adequada de procedimentos corretos e relevantes aplicados à fundição (ex: controle da taxa de resfriamento, tratamentos térmicos pós-fundição, inoculação/refino de grão, desgaseificação, projeto adequado de canais e massalotes).

**Critério 2 - Explicação dos Mecanismos de Ação**
- (0 pontos). O aluno não explica os procedimentos citados ou fornece explicações completamente incorretas e sem base metalúrgica.
- (1 ponto). A explicação é superficial ou parcial. O aluno descreve o que o procedimento faz, mas falha em conectar de forma clara e técnica como isso afeta diretamente a microestrutura e as propriedades mecânicas resultantes.
- (2 pontos). O aluno explica detalhadamente e com precisão técnica como cada procedimento citado atua na microestrutura da peça (ex: formação de grãos finos, alívio de tensões, eliminação de porosidades) e como isso se traduz em propriedades mecânicas favoráveis (ex: maior tenacidade, resistência à tração ou dureza).

**Critério 3 - Uso da Terminologia Técnica**
- (0 pontos). O aluno utiliza vocabulário coloquial inadequado ou comete erros graves na terminologia técnica da área de processos de fabricação.
- (1 ponto). O aluno demonstra conhecimento básico dos termos, mas apresenta algumas imprecisões ou falta de rigor metalúrgico na redação.
- (2 pontos). O aluno utiliza a terminologia técnica (ex: nucleação, estrutura dendrítica, defeitos de contração, perlita/martensita, etc.) de forma precisa e fluida durante toda a resposta.
"""

STUDENT_PROMPT = """
Citar e explicar os procedimentos possíveis de serem feitos que favoreçam propriedades mecânicas favoráveis em produtos fundidos.
"""

STUDENT_RESPONSE = """
### 2026-03-19T18:11:28.699Z
Focando nos estágios em que o metal está líquido, o controle de impurezas é fundamental para otimizar as propriedades mecânicas. Pode-se remover fósforo no conversor de oxigênio para evitar a fragilidade a frio (aumento da tenacidade em baixas temperaturas), e retirar enxofre no forno panela para prevenir a fragilidade a quente e melhorar a ductilidade e a usinabilidade. A remoção de oxigênio, nitrogênio e hidrogênio via degaseificador a vácuo é crucial: a retirada de hidrogênio previne a formação de trincas internas (flocos), enquanto a redução de oxigênio e nitrogênio minimiza a formação de inclusões não metálicas, o que aumenta significativamente a resistência à fadiga do aço. Para propriedades mecânicas excepcionais e isotrópicas (iguais em todas as direções), altera-se para o lingotamento convencional seguido do processo VAR (Vacuum Arc Remelting) , que além de purificar o metal ao extremo, promove uma solidificação direcional que refina a microestrutura, eliminando a porosidade central e a segregação.
"""