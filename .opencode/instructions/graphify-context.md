# Graphify Knowledge Graph — Fast Codebase Context

`graphify-out/graph.json` exists with a pre-built knowledge graph (god nodes, community structure, cross-file relationships).

**Before answering any codebase architecture/file-relationship question:**

- Run `graphify query "<question>"` for BFS traversal
- Run `graphify path "<A>" "<B>"` for shortest path between concepts
- Run `graphify explain "<node>"` for a plain-language explanation of a node
- If the graphify CLI is unavailable, traverse `graphify-out/graph.json` via NetworkX inline

Do NOT grep/search files manually for architecture questions. The graph answers faster.
