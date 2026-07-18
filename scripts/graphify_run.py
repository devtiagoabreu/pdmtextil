import json, sys, os
from pathlib import Path
import networkx as nx
from networkx.algorithms.community import louvain_communities
from graphify.detect import detect
from graphify.extract import extract
from graphify.build import build_from_json
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html

if __name__ == "__main__":
    target = sys.argv[1]
    INPUT = Path(target)
    OUT = INPUT / "graphify-out"
    OUT.mkdir(exist_ok=True)

    # Detect
    r = detect(INPUT)
    print("Detect: %d files, ~%d words" % (r["total_files"], r["total_words"]))
    (OUT / ".graphify_detect.json").write_text(json.dumps(r))

    # Extract AST (code only)
    code = r["files"].get("code", [])
    if code:
        e = extract([Path(x) for x in code], parallel=False)
        print("AST: %d nodes, %d edges" % (len(e["nodes"]), len(e["edges"])))
    else:
        e = {"nodes": [], "edges": [], "hyperedges": [], "input_tokens": 0, "output_tokens": 0}
        print("No code files found")
    (OUT / ".graphify_extract.json").write_text(json.dumps(e, indent=2))

    # Build graph
    G = build_from_json(e)
    if G.number_of_nodes() == 0:
        print("Empty graph - nothing to analyze")
        sys.exit(0)

    # Cluster (bypass graphify's multiprocessing)
    comms_raw = list(louvain_communities(G, seed=42))
    comms = {i: list(c) for i, c in enumerate(comms_raw)}
    coh = {i: 0.5 for i in comms}
    gods = god_nodes(G)
    surprises = surprising_connections(G, comms)
    labels = {i: "Community %d" % i for i in comms}
    questions = suggest_questions(G, comms, labels)

    print("Graph: %d nodes, %d edges, %d communities" % (G.number_of_nodes(), G.number_of_edges(), len(comms)))

    # Report
    report = generate(G, comms, coh, labels, gods, surprises, r,
        {"input": 0, "output": 0}, str(INPUT), suggested_questions=questions)
    (OUT / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")
    print("Report written")

    # Export
    to_json(G, comms, str(OUT / "graph.json"))
    to_html(G, comms, str(OUT / "graph.html"), community_labels=labels)
    print("JSON + HTML exported")

    # Analysis
    analysis = {
        "communities": {str(k): v for k, v in comms.items()},
        "cohesion": {str(k): v for k, v in coh.items()},
        "gods": gods,
        "surprises": surprises,
        "questions": questions,
    }
    (OUT / ".graphify_analysis.json").write_text(json.dumps(analysis, indent=2))
    print("Done")
