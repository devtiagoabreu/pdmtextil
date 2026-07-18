import json, sys
from pathlib import Path
import networkx as nx
from networkx.algorithms.community import louvain_communities
from graphify.detect import detect
from graphify.extract import collect_files, extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html

if __name__ == "__main__":
    INPUT = Path(".")
    OUT = INPUT / "graphify-out"
    OUT.mkdir(exist_ok=True)

    print("[1/6] Detectando arquivos...")
    r = detect(INPUT)
    print("  %d files, ~%d words" % (r["total_files"], r["total_words"]))
    print("  code: %d, docs: %d, papers: %d, images: %d" % (
        len(r["files"].get("code", [])),
        len(r["files"].get("document", [])),
        len(r["files"].get("paper", [])),
        len(r["files"].get("image", [])),
    ))
    (OUT / ".graphify_detect.json").write_text(json.dumps(r))

    print("[2/6] Extraindo AST de %d arquivos de código..." % len(r["files"].get("code", [])))
    code = [Path(x) for x in r["files"].get("code", [])]
    e = extract(code, parallel=False)
    print("  AST: %d nodes, %d edges" % (len(e["nodes"]), len(e["edges"])))
    (OUT / ".graphify_extract.json").write_text(json.dumps(e, indent=2))

    print("[3/6] Construindo grafo...")
    G = build_from_json(e)
    print("  Grafo: %d nodes, %d edges" % (G.number_of_nodes(), G.number_of_edges()))

    if G.number_of_nodes() == 0:
        print("Empty graph. Nothing to do.")
        sys.exit(0)

    print("[4/6] Clusterizando...")
    comms_raw = list(louvain_communities(G, seed=42))
    comms = {i: list(c) for i, c in enumerate(comms_raw)}
    coh = {i: 0.5 for i in comms}
    gods = god_nodes(G)
    surprises = surprising_connections(G, comms)
    labels = {i: "Community %d" % i for i in comms}
    questions = suggest_questions(G, comms, labels)
    print("  %d comunidades" % len(comms))

    print("[5/6] Gerando relatório e exportando...")
    report = generate(G, comms, coh, labels, gods, surprises, r,
        {"input": 0, "output": 0}, str(INPUT), suggested_questions=questions)
    (OUT / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")

    to_json(G, comms, str(OUT / "graph.json"))
    to_html(G, comms, str(OUT / "graph.html"), community_labels=labels)
    print("  Report, JSON, HTML salvos")

    analysis = {
        "communities": {str(k): v for k, v in comms.items()},
        "cohesion": {str(k): v for k, v in coh.items()},
        "gods": gods,
        "surprises": surprises,
        "questions": questions,
    }
    (OUT / ".graphify_analysis.json").write_text(json.dumps(analysis, indent=2))

    print("[6/6] Concluído!")
    print("  %d nodes, %d edges, %d comunidades" % (G.number_of_nodes(), G.number_of_edges(), len(comms)))
    print("  graph.html  - abre no navegador")
    print("  graph.json  - dados brutos")
    print("  GRAPH_REPORT.md - relatório completo")
