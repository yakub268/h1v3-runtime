🐝 First‑Time Setup: Creating Your First Agent

The h1v3 runtime loads agents from:

~/.h1v3/agents/

This directory (and all sub-directories) are not created automatically, so you must create them before you use the h1v3-runtime!


-------------------------------------
1. --- Create the agent directory ---

mkdir -p ~/.h1v3/agents/directory_scout/tools

First Agent's name will be directory_scout because it will be a directory inspecting agent.


----------------------------
2. --- Create agent.json ---

Create agent.json inside:

~/.h1v3/agents/directory_scout/agent.json

Add this JSON code inside agent.json:

{
  "name": "directory_scout",
  "model": "gemma4:e2b",
  "system": "You are a strict tool-using agent. You NEVER answer directly. When the user asks anything involving files, directories, paths, or the filesystem, you MUST call the 'listDirectory' tool using this exact JSON format: {\"tool\": \"listDirectory\", \"arguments\": {\"path\": \"<path>\"}}. After the tool result is returned, you MUST produce a final assistant message summarizing the tool output."
}


--------------------------
3. --- Create agent.js ---

Create agent.js inside:

~/.h1v3/agents/directory_scout/agent.js

Add this JS code inside agent.js:

module.exports = {
  description: "Lists files in a directory using a tool."
};


--------------------------
4. --- Create the tool ---

Create listDirectory.js inside:

~/.h1v3/agents/directory_scout/tools/listDirectory.js

Add this JS code inside listDirectory.js:

const fs = require("fs");

module.exports = {
  run: async ({ path }) => {
    return fs.readdirSync(path);
  }
};


--------------------------------------------------------------------------
5. --- Start the H1V3-Runtime and Deploy your custom local H1V3 Agent! ---

Enter the ~/h1v3-runtime directory with the command:

cd ~/h1v3-runtime/


Start up the h1v3-runtime agent runtime with the command:

node runtime.cjs


You should see:

Loaded agent: directory_scout
h1v3 runtime listening on 3928


-----------------------------
6. --- Talk to your agent ---


