====================================================================
====================================================================
====================================================================



<p align="center">
  <img src="h1v3-runtime_logo.png" alt="h1v3-runtime logo" width="640">
</p>



📄 AgentSetupREADME.md

A step-by-step guide to creating your first h1v3 agent. This is going to be a hell of lot easier if you have vscode installed otherwise just use nano or gedit or something to edit files like a caveman.



h1v3-runtime — Build Your First Agent

This guide walks you through creating a real agent inside your h1v3.

You will:

    Create an agent folder (follow RuntimeSetupREADME.md)

    Write agent.json

    Write agent.js

    Add a tool

    Start the runtime

    Talk to your agent

Then you can say "H1V3 ONLINE!", outloud, like a weird little robot in your wierd little robot voice..



====================================================================
1. Create your agent directory

We will start our agentic journey with a directory listing scout.

If you havnt already, open a terminal and run:

- mkdir -p ~/.h1v3/agents/dir_scout/tools

then..

- mkdir -p ~/.h1v3/agents/dir_scout/sessions

You can name your agents anything. It doesnt have to be /dir_scout/.



====================================================================
2. Open VSCode with only ~/.h1v3 folder

Enter ~/.h1v3 directory by running:

- cd ~/.h1v3/

then invoke vscode by running (yes, with the period):

- code .



====================================================================
3. Create the agent.js inside ~/.h1v3/agents/dir_scout/agent.js

put this massive amount of code inside agent.js:

- module.exports = {};

The intelligence lives in the model, the system prompt, the tool definitions so agent.js is only needed if you want to override behavior with custom JavaScript.

This file is expected by the runtime loader so you better have it present inside your ~/.h1v3 mister..



====================================================================
4. Create the agent.json inside ~/.h1v3/agents/dir_scout/agent.json

use this JSON structure inside agent.json:

{
  "name": "dir_scout",
  "model": "qwen2.5:7b-instruct",
  "system": "You are a tool-using agent. When a tool is available and needed, you MUST call it using the built-in function calling system. You NEVER invent tools. You NEVER guess tool names. You ONLY call tools that exist in your tool list. When you need to use a tool, respond using the standard tool_call format produced by the model. Do NOT wrap tool calls in custom JSON. Use ONLY the built-in function calling mechanism. After receiving a tool result, decide whether to call another tool or produce a final answer. When you are done using tools, produce a final assistant message summarizing your findings.",
  "tools": [
    {
      "name": "listDirectory",
      "description": "List the files in a directory",
      "parameters": {
        "type": "object",
        "properties": {
          "path": { "type": "string" }
        },
        "required": ["path"]
      }
    }
  ]
}



What each field means

name:  
The agent’s unique identifier. This is the name you use when calling the agent via the runtime API.

model:
Any model supported by your local runtime (e.g., qwen2.5:7b-instruct, llama3.1:8b, etc.).

system:
This is the agent’s “constitution”. It defines how strictly the agent must use tools, how it reasons, and what behaviors are forbidden.

tools:
A list of tool definitions. Each tool includes:
-a name
-a description
-a JSON schema describing the parameters

This schema is what allows the model to produce valid function calls.



====================================================================
5. Create your first tool

Create ~/.h1v3/agents/dir_scout/tools/listDirectory.js file to create your first tool:

listDirectory.js Tool Code:

const fs = require("fs");

module.exports = {
  run: async ({ path }) => {
    try {
      return fs.readdirSync(path);
    } catch (e) {
      return { error: e.message };
    }
  }
};



This tool accepts a single parameter: path, reads the directory at that path, returns an array of filenames, and if something goes wrong (e.g., invalid path), it returns an error object instead of crashing.

Your agent.json must reference this tool!

You can now begin testing by entering ~/h1v3-runtime and running:

- node runtime.cjs



Friendly Reminder of the standard agent directory structure:

<p align="center">
  <img src="h1v3-runtime_agent_structure.png" alt="h1v3-runtime agent structure" width="300">
</p>



--- n3z ---



<p align="center">
  <img src="h1v3-runtime_logo.png" alt="h1v3-runtime logo" width="640">
</p>