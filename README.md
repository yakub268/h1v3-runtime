<p align="center">
  <img src="h1v3-runtime_logo.png" alt="h1v3-runtime logo" width="520">
</p>


📘 h1v3 Runtime — README

---------------------------------------------------------------------
🚀 Start the h1v3 Agent Runtime after Agent creation

From inside the h1v3-runtime directory:

cd ~/h1v3-runtime

node runtime.cjs


You should see:

Loaded agent: directory_scout
h1v3 runtime listening on 3928


Leave this terminal running — it is the active agent engine.

---------------------------------------------------------------------
🤖 Send a Request to an Agent

Open a second terminal and run:
bash

curl -X POST http://localhost:3928/agent/directory_scout \
  -H "Content-Type: application/json" \
  -d '{"input": "List the files in /home/n3z-laptop"}'

Expected output (example):
json

{
  "output": "The files and directories in `/home/n3z-laptop` are: ..."
}

This confirms:

    - the runtime is active
    - the agent is loaded
    - the model is responding
    - the tool executed
    - the agent produced a final answer

========================================================================
📁 Agent Directory Structure

Agents live in:

~/.h1v3/agents/<agent-name>/   (first agent created was /directory_scout)

Each agent contains:

agent.json      # model + system prompt
agent.js        # agent metadata
tools/          # tool scripts (CommonJS)
sessions/       # optional session logs

First Agent Example:

~/.h1v3/agents/directory_scout/
    agent.json
    agent.js
    tools/
        listDirectory.js

-------------------------------------------------------------------------

🛠 Add New Tools

Add new tools inside:

~/.h1v3/agents/<agent-name>/tools/

Each tool is a CommonJS module:

module.exports = {
  run: async (args) => {
    // your logic here
  }
};

Tools are auto‑loaded and hot‑reloaded by the runtime.

-------------------------------------------------------------------------

🧠 Add New Agents

Create a new folder:

~/.h1v3/agents/<new-agent-name>/

Add:

    - agent.json
    - agent.js
    - tools/ directory

The runtime will automatically detect and load it.

-------------------------------------------------------------------------

🧩 Model Requirements

The runtime uses the model specified in each agent’s agent.json.

Example:

"model": "gemma4:e2b"

Ensure the model is installed:

ollama list

Install if needed:

ollama pull gemma4:e2b
