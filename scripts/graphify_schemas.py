import json, sys
from pathlib import Path
from graphify.detect import detect
from graphify.extract import collect_files, extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html

if __name__ == "__main__":
    INPUT = Path("src/lib/db/schema")
    OUT = INPUT / "graphify-out"
    OUT.mkdir(exist_ok=True)

    detect_result = detect(INPUT)
    print(f"Detect: {detect_result['total_files']} files, ~{detect_result['total_words']} words")
    (OUT / ".graphify_detect.json").write_text(json.dumps(detect_result))

    code_files = detect_result["files"].get("code", [])
    extraction = extract([Path(f) for f in code_files], parallel=False)
    print(f"AST: {len(extraction['nodes'])} nodes, {len(extraction['edges'])} edges")
    (OUT / ".graphify_extract.json").write_text(json.dumps(extraction, indent=2))

    G = build_from_json(extraction)
    communities = cluster(G)
    cohesion = score_all(G, communities)
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    labels = {cid: f"Community {cid}" for cid in communities}
    questions = suggest_questions(G, communities, labels)

    report = generate(G, communities, cohesion, labels, gods, surprises, detect_result,
        {"input": 0, "output": 0}, str(INPUT), suggested_questions=questions)
    (OUT / "GRAPH_REPORT.md").write_text(report)
    to_json(G, communities, str(OUT / "graph.json"))
    to_html(G, communities, str(OUT / "graph.html"), community_labels=labels)

    analysis = {
        "communities": {str(k): v for k, v in communities.items()},
        "cohesion": {str(k): v for k, v in cohesion.items()},
        "gods": gods,
        "surprises": surprises,
        "questions": questions,
    }
    (OUT / ".graphify_analysis.json").write_text(json.dumps(analysis, indent=2))

    print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities")
