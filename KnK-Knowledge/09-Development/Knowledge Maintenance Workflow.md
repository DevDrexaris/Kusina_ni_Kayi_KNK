# Knowledge Maintenance Workflow

**Evidence status:** Workflow for maintaining this vault; source facts must be re-verified on each change.

1. Start at [[KnK Home]], then open only the notes relevant to the task. Use [[Graph Index]] to follow existing relationships.
2. Verify each claim against current code before editing; code wins over notes. Check the actual runtime/deployment copy where the task concerns served behavior.
3. After a confirmed architectural/data-flow change, update the affected curated notes and the Graphify output. Do not update notes for speculative designs.
4. Add investigation entries with dated symptom, evidence, cause, changed files, validation, and status. Separate VERIFIED from INFERRED/UNVERIFIED.
5. Re-run the smallest relevant checks in [[Testing Guide]].
6. Keep application changes and knowledge-only changes scoped separately; never place passwords or secrets in this vault.

## Refresh Graphify

From project root, use the installed Graphify CLI:

```powershell
graphify update . --no-cluster
graphify export obsidian --graph "graphify-out\graph.json" --dir "KnK-Knowledge\11-Graph\Graphify-Generated"
```

`.graphifyignore` excludes the generated vault, graph output, dependencies, build output, and local account/environment files so updates do not ingest their own artifacts or local credentials. This is the verified no-LLM workflow. Preserve `graphify-out/` and `Graphify-Generated/` outputs; do not hand-edit them. Review Graphify warnings and [[Graph Index]] limitations after updates. If Graphify reports fewer nodes after a refactor, inspect before using `--force`.
