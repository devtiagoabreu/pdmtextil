import json, sys, shutil
from pathlib import Path
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html
from networkx.readwrite import json_graph
import networkx as nx
from collections import Counter

if __name__ == "__main__":
    # Backup old graph
    old_path = Path("graphify-out/graph.json")
    if old_path.exists():
        shutil.copy2(old_path, "graphify-out/.graphify_old.json")

    # Load new AST extraction
    new_ext = json.loads(Path("graphify-out/.graphify_ast.json").read_text())
    G_new = build_from_json(new_ext)
    print(f"New extraction: {G_new.number_of_nodes()} nodes, {G_new.number_of_edges()} edges")

    # Build semantic extraction (empty for code-only update)
    sem = {"nodes": [], "edges": [], "hyperedges": [], "input_tokens": 0, "output_tokens": 0}
    Path("graphify-out/.graphify_semantic.json").write_text(json.dumps(sem, indent=2))

    # Merge: AST nodes + semantic nodes deduped
    seen = {n["id"] for n in new_ext["nodes"]}
    merged_nodes = list(new_ext["nodes"])
    for n in sem.get("nodes", []):
        if n["id"] not in seen:
            merged_nodes.append(n)
            seen.add(n["id"])
    merged_edges = new_ext["edges"] + sem.get("edges", [])
    merged_hyperedges = sem.get("hyperedges", [])
    merged = {
        "nodes": merged_nodes,
        "edges": merged_edges,
        "hyperedges": merged_hyperedges,
        "input_tokens": sem.get("input_tokens", 0),
        "output_tokens": sem.get("output_tokens", 0),
    }
    Path("graphify-out/.graphify_extract.json").write_text(json.dumps(merged, indent=2))
    print(f"Merged extraction: {len(merged_nodes)} nodes, {len(merged_edges)} edges")

    # Merge new graph into existing graph
    existing_data = json.loads(old_path.read_text()) if old_path.exists() else None
    if existing_data:
        G_existing = json_graph.node_link_graph(existing_data, edges="links")
        print(f"Existing graph: {G_existing.number_of_nodes()} nodes, {G_existing.number_of_edges()} edges")
        G_existing.update(G_new)
        G = G_existing
        print(f"Merged: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    else:
        G = G_new

    # Detection info
    detection = json.loads(Path("graphify-out/.graphify_detect.json").read_text()) if Path("graphify-out/.graphify_detect.json").exists() else {}
    if not detection:
        detection = {"total_files": 0, "total_words": 0, "needs_graph": True, "warning": None, "files": {"code": [], "document": [], "paper": []}}
    
    tokens = {"input": 0, "output": 0}

    # Cluster
    communities = cluster(G)
    cohesion = score_all(G, communities)
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    labels = {cid: f"Community {cid}" for cid in communities}
    questions = suggest_questions(G, communities, labels)

    report = generate(G, communities, cohesion, labels, gods, surprises, detection, tokens, ".", suggested_questions=questions)
    Path("graphify-out/GRAPH_REPORT.md").write_text(report, encoding="utf-8")
    to_json(G, communities, "graphify-out/graph.json")

    analysis = {
        "communities": {str(k): list(v) for k, v in communities.items()},
        "cohesion": {str(k): v for k, v in cohesion.items()},
        "gods": gods,
        "surprises": surprises,
        "questions": questions,
    }
    Path("graphify-out/.graphify_analysis.json").write_text(json.dumps(analysis, indent=2))

    if G.number_of_nodes() == 0:
        print("ERROR: Graph is empty - extraction produced no nodes.")
        sys.exit(1)
    print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities")

    # Also save a basic labels file so HTML viz works
    Path("graphify-out/.graphify_labels.json").write_text(json.dumps({str(k): f"Community {k}" for k in communities}))

    # Show diff
    if existing_data:
        old_G = json_graph.node_link_graph(existing_data, edges="links")
        new_nodes = set(G.nodes()) - set(old_G.nodes())
        new_edges = set(G.edges()) - set(old_G.edges())
        print(f"Diff: +{len(new_nodes)} nodes, +{len(new_edges)} edges")
        if new_nodes:
            new_labels = [G.nodes[n].get("label", n) for n in list(new_nodes)[:5]]
            print(f"  New nodes (sample): {new_labels}")

    # HTML viz
    NODE_LIMIT = 5000
    if G.number_of_nodes() > NODE_LIMIT:
        print(f"Graph has {G.number_of_nodes()} nodes (above {NODE_LIMIT} limit). Building aggregated community view...")
        node_to_community = {nid: cid for cid, members in communities.items() for nid in members}
        meta = nx.Graph()
        for cid, members in communities.items():
            meta.add_node(str(cid), label=labels.get(cid, f"Community {cid}"))
        edge_counts = Counter()
        for u, v in G.edges():
            cu, cv = node_to_community.get(u), node_to_community.get(v)
            if cu is not None and cv is not None and cu != cv:
                edge_counts[(min(cu, cv), max(cu, cv))] += 1
        for (cu, cv), w in edge_counts.items():
            meta.add_edge(str(cu), str(cv), weight=w, relation=f"{w} cross-community edges", confidence="AGGREGATED")
        if meta.number_of_nodes() > 1:
            member_counts = {cid: len(members) for cid, members in communities.items()}
            to_html(meta, {cid: [str(cid)] for cid in communities}, "graphify-out/graph.html", community_labels=labels or None, member_counts=member_counts)
            print(f"graph.html written (aggregated: {meta.number_of_nodes()} community nodes)")
    else:
        to_html(G, communities, "graphify-out/graph.html", community_labels=labels or None)
        print("graph.html written")

    # Cleanup
    Path("graphify-out/.graphify_old.json").unlink(missing_ok=True)
