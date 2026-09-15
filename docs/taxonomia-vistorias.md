# Taxonomia de Vistorias Periódicas — Indústria Têxtil

Catálogo de vistorias/inspeções periódicas para uma fábrica têxtil brasileira, usado como
**base do seed do módulo Ativos e Vistorias** (`scripts/seed-vistorias.ts`) e como
referência de vigência/periodicidade. Organizado por **setor responsável** (os mesmos
enums do módulo: `MECANICA`, `SEGURANCA`, `ELETRICA`, `AMBIENTAL`, `PREDIAL`, `LOGISTICA`).
`NR` = Norma Regulamentadora do Min. do Trabalho/Emprego. `NBR` = norma ABNT.

> Aviso: periodicidades e bases legais são referência de acompanhamento — confirme sempre
> a versão vigente da norma e o manual do fabricante do equipamento.

---

## 1. Mecânica / Manutenção — `MECANICA`

| Vistoria | Periodicidade típica | Base legal/referência | O que verificar |
|---|---|---|---|
| Troca de óleo — redutores, caixas, acoplamentos | 6–12 meses ou horas do fabricante | Manual do fabricante | Nível, cor, viscosidade, contaminantes |
| Nível/qualidade de óleo — hidráulicos | Diária (operador) / semestral (análise) | Boas práticas | Nível, cor, água/partículas |
| Lubrificação geral (mancais, guias, graxeiras) | Diária (operador) / semestral (mnto) | Manual do fabricante | Pontos de graxa, quantidade, obstrução |
| Rolamentos | Semestral a anual | ISO 281 / fabricante | Ruído, temperatura, folga, vibração |
| Correias e polias | Mensal visual; troca 6–12 meses | Fabricante | Trincas, desgaste, alinhamento, tensão |
| Correntes de acionamento | Trimestral | Boas práticas | Alongamento, elos desgastados, lubrificação |
| Teares circulares — agulhas, discos, camisas | Semestral / por contagem de peças | Fabricante | Desgaste dimensional, trincas, afiação |
| Teares planos — inserção, lançadeira/pinças | Semestral | Fabricante | Desgaste de componentes, alinhamento, folgas |
| Cardagem — punteiros, cilindros, fitas | Semestral | Boas práticas têxteis | Dentes, alinhamento cilindro-casco, limpeza |
| Filatório — anéis, travelers, fusos, guias | Semestral | Boas práticas têxteis | Desgaste de anéis, alinhamento, tensão do fio |
| Tinturaria — cilindros, válvulas, trocadores | Semestral | Fabricante | Corrosão, vedação, desincrustação |
| Estamparia — cilindros, clichês, registro | Semestral | Boas práticas | Relevos, alinhamento, registro de cores |
| Alvejamento — tanques, agitadores | Semestral | Boas práticas | Corrosão por químicos, vedação |
| Compressores — dreno, filtros, óleo, válv. seg. | Diária (dreno) / semestral (mnto) / anual (VVS) | NR-13 (vasos) / fabricante | Condensado, filtros, óleo, temperatura, ruído |
| Bombas — vedação, vazamentos, rolamentos | Mensal visual / semestral mnto | Fabricante | Vedações, temperatura, vibração, alinhamento |
| Motores elétricos — mecânico | Mensal visual / anual instrumentado | IEC/NEMA | Termografia, vibração, isolamento (megger) |
| Redutores e engrenagens | Semestral | Fabricante | Óleo, temperatura, ruído, vazamentos |
| Embreagens | Semestral | Fabricante | Pastilha, folga, temperatura |
| Alinhamento de eixos/acoplamentos | Anual; após qualquer intervenção | ISO 10816 | Laser/relógio, chavetas, espigas |
| Balanceamento de rotores | Anual; após substituição | ISO 21940 | Vibração, ruído |
| Prensas — freio, guias, golpe, vedação | Semestral | NR-12 / fabricante | Curso, alinhamento, folgas, freio |
| Esteiras transportadoras | Mensal visual / semestral completa | NR-12 / NBR 14562 | Correia, roletes, tambor, tensão |
| Soldas estruturais/reparo | A cada reparo; anual estruturas | NBR 8800 / ASME | Trincas, porosidade; END/LPI críticos |
| Mancais | Semestral | Boas práticas | Folga, desgaste, lubrificação, temperatura |
| **Ponte rolante — checklist diário** | Diária (antes do uso) | NR-11 + NR-12 | Estrutura, cabos, ganchos, freios, limitadores |
| **Ponte rolante — laudo técnico** | Anual (semestral p/ uso pesado) | NR-11 + NBR 16147 + ISO 4309/9927 | END, teste de carga, medições, ART |
| Talhas manual/elétrica | Diária (operador) / anual (laudo) | NR-11 + ISO 9927 | Corrente, gancho, freio, cadeado, fixação |
| Empilhadeiras — mecânica | Conforme horas (250h/500h) | NR-11 + fabricante | Óleo, hidráulico, mastro, pneus |
| Freios mec./hidr./eletromagnéticos | Semestral | NR-12 | Lona, curso, tempo de resposta |
| Transmissões/acoplamentos flexíveis | Anual | Fabricante | Desgaste, desalinhamento, elastômero |
| Torres de resfriamento / refrigeração | Semestral limpeza / anual estrutural | Boas práticas | Incrustação, vazamentos, nível |

## 2. Segurança do Trabalho — `SEGURANCA`

| Vistoria | Periodicidade típica | Base legal/referência | O que verificar |
|---|---|---|---|
| **Extintor — conferência visual** | **Mensal** | NR-23 + NBR 12962 | Lacre, selo INMETRO, manômetro na faixa verde, validade, acesso, fixação |
| **Extintor — inspeção técnica** | 6 meses (CO2) / 12 meses (demais) | NBR 12962 | Pressão, peso, teste parcial, componentes |
| **Extintor — manutenção 2º nível** | 5 anos | NBR 12962 | Troca de carga, limpeza interna |
| **Extintor — teste hidrostático (3º nível)** | 5 anos desde fabricação/último teste | NBR 12962 | Corpo, componentes, recertificação |
| **Hidrante — inspeção visual** | **Mensal** | NR-23 + NBR 13714 | Acesso, mangueira, acoplamentos, válvula |
| **Hidrante — teste pressão/vazão** | **Anual** | NBR 13714 | Pressão residual, vazão na ponta, tubulação |
| Abrigos/suportes de extintores/hidrantes | Mensal | NR-23 | Integridade, sinalização, fixação |
| Chuveiros de emergência (lava-corpo) | Semestral | NBR 13852 | Fluxo, temperatura, acesso |
| Lava-olhos | Semestral | ANSI Z358.1 | Fluxo limpo, acesso, sinalização |
| Alarme de incêndio | Mensal funcional / anual completa | NR-23 | Detectores, central, sirenes, baterias |
| Detectores de fumaça/calor/chama | Semestral | NBR 5419/fabricante | Sensibilidade, limpeza, bateria |
| Central de alarme / CFTV | Mensal funcional / anual preventiva | NR-23 | Gravação, baterias, integridade |
| Iluminação de emergência | Mensal 30s / semestral 90min | NR-23 / NBR 5418 | Bateria, lâmpadas, rota |
| Saídas de emergência / rotas de fuga | Mensal | NR-23 | Desobstrução, sinalização, abertura fácil |
| Sinalização de segurança | Mensal | NR-26 | Placas, cores, pictogramas |
| Brigada de incêndio — treinamento/reciclagem | Anual | NR-23 / NBR 14628 | Capacitação, cargas horárias |
| Simulado de evacuação | Anual | NR-23 / Corpo de Bombeiros | Evacuação, tempo, registro |
| EPI — inspeção pré-uso e controle de CA | Antes do uso / contínuo | NR-06 | Integridade, CA vigente, vida útil |
| PGR / LTCAT — atualização | Anual | NR-09 / NR-01 | Riscos, medições, ambientes |
| **NR-12 — proteções de máquinas** | Conforme cronograma | NR-12 | Proteções íntegras, intertravamentos |
| NR-12 — botões de emergência, foto-células | Mensal | NR-12 | Acionamento, tempo de resposta |
| NR-12 — sistemas de segurança | Semestral | NR-12 | Chaves, fiação, funcionalidade |
| **NR-13 — caldeiras (inspeção periódica)** | 12 à 48 meses (conforme categoria/PLH) | NR-13 | Exame interno/externo, válvulas, prontuário |
| **NR-13 — vasos de pressão** | 1–10 anos (conforme categoria) | NR-13 | Exame externo/interno, PLH |
| EPI redes elétricas (NR-10) | Conforme uso | NR-10 | Prontuário, conformidade |
| **NR-35 — cinturões, talabartes, trava-quedas** | Antes do uso / anual periódica | NR-35 | Costuras, mosquetões, absorvedor, cordas |
| NR-35 — linha de vida e ancoragem | Antes do uso / anual qualificada | NR-35 Anexo II | Tensão, corrosão, fixação |
| NR-35 — plataformas de altura | Antes do uso | NR-35 / NR-18 | Guarda-corpos, pranchas, estabilidade |
| Andaimes | Antes do uso / anual qualificada | NR-18 / NR-35 | Fixação, pranchas, rodízios, diagonais |
| Escadas fixas/móveis | Mensal visual / anual estrutural | NR-18 / NBR 14566 | Degraus, corrimãos, superfície antiderrapante |
| Elevadores/monta-cargas | Semestral inspeção / anual teste | NBR 5836 / NR-11 | Cabos, freios, segurança, nivelamento |
| Eslingas, cabos de aço, cintas | Mensal (cabos pesado) a anual | NBR ISO 4309 / NBR 15637 | Desgaste, fios rompidos, critérios de descarte |
| Análise de risco / Permissão de Trabalho | A cada serviço não rotineiro | NR-01 + NR-10 + NR-35 | Riscos, controles, autorização |

## 3. Elétrica / Eletrônica / SPDA — `ELETRICA`

| Vistoria | Periodicidade típica | Base legal/referência | O que verificar |
|---|---|---|---|
| **SPDA — inspeção visual** | Semestral (ou 1–3 anos conforme risco) | NBR 5419 | Captores, descidas, aterramento, corrosão |
| **SPDA — continuidade/aterramento** | 1 ou 3 anos conforme risco | NBR 5419 | Continuidade elétrica, resistência |
| Aterramento geral / malha | Anual | NBR 5419 / NR-10 | Medição, integridade das hastes |
| Quadros e painéis — inspeção visual | Mensal | NR-10 | Limpeza, terminais, aquecimento, rótulos |
| DRs — teste do botão TEST | **Mensal** (DR); semestral (disj.) | NR-10 / NBR 5410 | Corrente de fuga, atuação |
| **Termografia de quadros** | Semestral a anual | NR-10 / NBR 15763 | Pontos quentes, sobrecarga, conexões |
| Cabos e tomadas industriais | Mensal visual | NR-10 / NBR 5410 | Isolamento, conexões, temperatura |
| Iluminação industrial | Trimestral | NR-17 / NBR 5413 | Lâmpadas, refletores, iluminância |
| Motores elétricos — ensaios | Anual | IEC 60034 | Isolamento, corrente/fase, vibração |
| **Grupo gerador — teste** | Semanal (sem carga) / mensal (carga) | NBR 15643 / fabricante | Óleo, água, bateria, filtros, diesel |
| **Grupo gerador — troca de óleo/filtros** | 250h ou anual | Fabricante | Óleo, filtros ar/óleo/combustível |
| Nobreak/UPS — baterias | Mensal simulação / semestral medição | Fabricante | Autonomia, tensão, bornes |
| Transformadores — óleo dielétrico (DGA) | Anual | NBR 5743 / IEC 60422 | Gases, umidade, acidez, cor |
| CFTV / câmeras | Mensal limpeza / semestral preventiva | Boas práticas | Lentes, gravação, IR |
| Alarme de intrusão | Mensal funcional | Boas práticas | Sensores, baterias, central |
| Rede de dados / telefonia / WiFi | Mensal conectividade / anual preventiva | Boas práticas | Cabeamento, switches, APs, latência |

## 4. Ambiental — `AMBIENTAL`

| Vistoria | Periodicidade típica | Base legal/referência | O que verificar |
|---|---|---|---|
| Licenças ambientais (LAO/LAE/LO) | Conforme prazo da licença | CONAMA/estadual | Renovação, condicionantes, relatórios |
| **ETE — análises físico-químicas** | **Mensal** | CONAMA 430 / estadual | DBO, DQO, pH, óleos/graxas, coliformes |
| Resíduos sólidos — PGRS | Anual atualização / contínuo destinação | CONAMA 313 / Lei 12.305 | Classificação, segregação, MTR |
| Resíduos perigosos (classe I) | Conforme produção | NBR 10004 / CONAMA 313 | Acondicionamento, rotulagem, destino |
| Emissões atmosféricas — caldeira | Anual | CONAMA 382 / estadual | CO, NOx, SOx, particulado |
| Ruído ocupacional (dosimetria/LTCAT) | Anual | NR-09 / NR-15 / NBR 10151 | Dosimetria 8h, mapa de ruído |
| Poeira/umidade/temperatura | Anual / conforme PGR | NR-09 / NR-17 | Particulados, conforto térmico |
| **Potabilidade da água** | **Semestral** (microbiológica) | NBR 5626 / Portaria MS 2914 | Coliformes, cloro, turbidez, pH |
| **Caixa d'água — limpeza/inspeção** | **Semestral** | NBR 5626 | Limpeza, desinfecção, vedação |
| Fossa séptica | Anual ou conforme volume | NBR 13969 | Lodo, aspiração |
| Sumidouro | Anual | Legislação sanitária | Infiltração, obstrução |
| Produtos químicos — PGRQ/contenção | Anual plano / semestral contenção | NR-20 / NBR 7500 | FISPQ, rotulagem, compatibilidade, bacia |
| Passivos ambientais / solo | Conforme identificação | Estadual / CETESB | Monitoramento de área contaminada |

## 5. Predial / Civil — `PREDIAL`

| Vistoria | Periodicidade típica | Base legal/referência | O que verificar |
|---|---|---|---|
| Estrutura (trincas, lajes, pilares) | Anual | NBR 6118 | Manifestações patológicas |
| **Telhado/calhas/rufos** | Anual + pós evento extremo | Boas práticas | Telhas, fixações, calhas, caimento |
| Pintura / fachada | Anual | Boas práticas | Descascamento, umidade, fungos |
| Pisos, portas, portões | Semestral visual / anual estrutural | Boas práticas | Desníveis, portão rolante, doca |
| Instalações hidráulicas/sanitárias | Semestral visual | Boas práticas | Vazamentos, canos, registros |
| Esgoto pluvial / ralos / bueiros | Semestral; antes das chuvas | Boas práticas | Obstrução, drenagem |
| Mezaninos e guarda-corpos | Anual | NR-12/NR-18 | Estrutura, fixação, altura |
| Escada de abandono | Semestral | NR-23 / Corpo de Bombeiros | Estrutura, corrimão, sinalização |
| **Ar-condicionado** | Filtro mensal / gás anual / limpeza semestral | NBR 14518 | Filtros, gás, condensadora |
| Exaustores e ventiladores | Filtro mensal / dutos semestral | Boas práticas | Filtros, mangueiras, balanceamento |
| Cortinas de ar / climatizadores | Mensal limpeza / semestral completa | Boas práticas | Trocadores, nível/pH da água |
| Dedetização / pragas | Conforme contrato (mensal–trimestral) | Sanitária | Tratamento, iscas, registros |
| Impermeabilização | Anual | Boas práticas | Bolhas, fissuras, infiltração |

## 6. Logística / Depósito — `LOGISTICA`

| Vistoria | Periodicidade típica | Base legal/referência | O que verificar |
|---|---|---|---|
| **Empilhadeira — checklist diário do operador** | **Diária** (antes do uso) | NR-11 + NR-12 | Freios, luzes, buzina, pneus, mastro, hidráulico |
| **Empilhadeira — vistoria competencial (laudo)** | **Anual** | NR-11 + NBR 14735 | Laudo técnica, ART, teste de carga |
| Patinete elétrico de carga | Semestral | Fabricante | Bateria, freio, roletes |
| Paleteiras | Anual | Fabricante | Cilindro, macaco, vedação |
| Cintas têxteis de içamento | Anual (normal) / trimestral (severo) | NBR 15637 | Cortes, costuras, identificação |
| Ganchos e manilhas | Anual | ASME B30.26 | Deformação, trincas, trava |
| Guinchos/guindastes | Diária operador / anual laudo | NR-11 + NBR 8400 | Cabo, freio, limitador, laudo |
| Plataformas elevatórias (PEMT) | Diária operador / conforme fabricante | NR-18 / NR-35 | Controles, emergência, estabilizadores |
| **Racks/estantes** | Anual + após impacto | NBR 14764 | Deformação, fixação, rótulos (capacity) |
| Transpaleteiras elétricas | Semestral | Fabricante | Bateria, roletes, freio |

## 7. Equipamentos de Proteção e Emergência — `SEGURANCA`

| Vistoria | Periodicidade típica | Base legal/referência | O que verificar |
|---|---|---|---|
| **Kit de primeiros socorros** | **Mensal** conferência | NR-07 / sanitária | Validade, completude, reposição |
| Maca / padiola | Semestral | Boas práticas | Funcionamento, limpeza |
| Colar cervical | Semestral | Boas práticas | Integridade, tamanho |
| Desfibrilador (DEA) | Mensal teste / anual preventiva | NBR 14710 | Teste automático, eletrodos, bateria |
| Lava-olhos portátil | Semestral | ANSI Z358.1 | Vedação, validade da solução |

## Complementares da indústria têxtil

| Vistoria | Periodicidade típica | Base legal/referência | O que verificar |
|---|---|---|---|
| **Umidade relativa (UR)** nos depósitos de tecido/matéria-prima | Diária (sensor); calibração anual | Boas práticas / NR-09 | UR 60–70% (mofo/ruptura de fios) |
| Temperatura/ventilação nas tecelagens | Diária (sensor); calibração anual | NR-17 | Conforto e operação |
| **Aspiração de fibras** (cardas, filatório, teares) | Diária (operador) / semestral (dutos) | NR-23 (incêndio por fibras) | Acúmulo nos dutos, filtros, exaustores |
| Aspersão/umidificação | Semestral | Boas práticas | Bicos limpos, nível de água |
| **Caldeira a vapor — NR-13** | 12 meses (cat. A/B) conforme PLH | NR-13 | Integridade, válvulas, manômetros, água |
| Redes de vapor e condensado | Mensal visual / anual completa | Boas práticas / NR-13 | Vazamentos, isolamento, válvulas |
| Tanques de corantes/químicos | Semestral | NR-20 / PGRQ | Corrosão, vedação, contenção |
| Bombas de dosagem | Semestral | Fabricante | Calibração, vedação, êmbolos |
| Trocadores de calor | Semestral limpeza / anual interna | Fabricante | Incrustação, vazamentos |
| Filtros de ar dos teares | Diária limpeza / semestral troca | Boas práticas | Pó, obstrução |
| Secadores / câmaras de secagem | Semestral | Boas práticas | Termostatos, filtros, risco de incêndio |
| Balanças — calibração | Anual | NBR 14036 / INMETRO | Certificado, erros |

---

## Periodicidades mais comuns por setor (resumo)

- **Mecânica**: diária (operador/lubrificação), semestral (rolamentos, bombas, têxteis),
  anual (alinhamento, balanceamento, laudos de ponte rolante/talha).
- **Segurança**: mensal (extintor visual, DR, iluminação emergência, EPI), semestral
  (lava-olhos, detectores, hidrante visual), anual (simulado, brigada, NR-13, NR-35).
- **Elétrica**: mensal (quadros, CFTV), semestral–anual (termografia, aterramento, SPDA),
  anual–3 anos (SPDA completo, transformadores).
- **Ambiental**: mensal (ETE), semestral (caixa d'água, potabilidade), anual
  (LTCAT, PGRS, emissões).
- **Predial**: semestral (hidráulica, esgoto, portões), anual (estrutura, telhado).
- **Logística**: diária (empilhadeira/ponte rolante), semestral (paleteiras,
  transpaleteiras), anual (vistoria competencial, racks, içamento).
- **Emergência**: mensal (kit, DEA), semestral (maca, colar, lava-olhos portátil).