<p align="center">
  <img src="h1v3-runtime_logo.png" alt="h1v3-runtime logo" width="640">
</p>

A lightweight local runtime for tool-using AI agents powered by [Ollama](https://ollama.com). Define an agent with a JSON manifest, drop tool implementations as Node modules, and expose them over a small HTTP API on `localhost:3928` plus a built-in dashboard on `localhost:3030`.

## Quick start

```bash
git clone https://github.com/dillonfaulk/h1v3-runtime.git
cd h1v3-runtime
npm install
node runtime/runtime.cjs
```

Requires Node.js 22+ and a running Ollama instance.

## Documentation

Read in order:

1. [OllamaSetupREADME.md](READMEs/OllamaSetupREADME.md) — install Ollama, Node, pull models
2. [RuntimeSetupREADME.md](READMEs/RuntimeSetupREADME.md) — clone, install deps, create `~/.h1v3`
3. [AgentSetupREADME.md](READMEs/AgentSetupREADME.md) — build your first agent and tool

See [NotesREADME.md](READMEs/NotesREADME.md) for the directory architecture overview.

Happy h1v3 building :)

---

Licensed under the [h1v3 Sovereign License v1.1](LICENSE) — projects using this runtime must include the attribution **"Agents Powered by h1v3-runtime!"** in their README or documentation.
