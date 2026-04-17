const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");

const AGENT_ROOT = path.join(process.env.HOME || process.env.HOMEPATH || ".", ".h1v3", "agents");
const app = express();
app.use(express.json());

let agents = {};

// Load all agents from ~/.h1v3/agents
function loadAgents() {
  agents = {};
  if (!fs.existsSync(AGENT_ROOT)) return;

  const agentNames = fs.readdirSync(AGENT_ROOT);
  for (const name of agentNames) {
    const agentDir = path.join(AGENT_ROOT, name);
    const manifestPath = path.join(agentDir, "agent.json");
    const agentFile = path.join(agentDir, "agent.js");
    const toolsDir = path.join(agentDir, "tools");

    if (!fs.existsSync(manifestPath) || !fs.existsSync(agentFile)) continue;

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    // Ensure tools is always an array (schema for Ollama)
    manifest.tools = Array.isArray(manifest.tools) ? manifest.tools : [];

    const agent = require(agentFile);

    // Load JS tool implementations
    let tools = {};
    if (fs.existsSync(toolsDir)) {
      const toolFiles = fs.readdirSync(toolsDir);
      for (const f of toolFiles) {
        if (!f.endsWith(".js")) continue;
        const toolName = f.replace(".js", "");
        tools[toolName] = require(path.join(toolsDir, f));
      }
    }

    agents[name] = { manifest, agent, tools };
    console.log(`Loaded agent: ${name}`);
  }
}

// Watch for changes and hot‑reload
chokidar
  .watch([
    path.join(AGENT_ROOT, "**/agent.json"),
    path.join(AGENT_ROOT, "**/agent.js"),
    path.join(AGENT_ROOT, "**/tools/*.js"),
  ])
  .on("all", () => {
    console.log("Reloading agents...");
    // Clear require cache for agent.js and tools
    Object.keys(require.cache).forEach((k) => {
      if (k.includes(AGENT_ROOT)) delete require.cache[k];
    });
    loadAgents();
  });

// Wrap tools in OpenAI/Ollama function schema
function formatTools(tools) {
  if (!tools || !Array.isArray(tools)) return [];

  return tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description || "",
      parameters: {
        type: "object",
        properties: t.parameters?.properties || {},
        required: t.parameters?.required || [],
      },
    },
  }));
}


// Call Ollama chat API
async function callOllama(messages, model, toolSchema) {
  const body = {
    model,
    messages,
    tools: formatTools(toolSchema),
    tool_choice: "auto",
    stream: false,
  };

  // console.log("OLLAMA REQUEST BODY:", JSON.stringify(body, null, 2));

  const res = await axios.post("http://localhost:11434/api/chat", body);
  return res.data;
}

// Extract first JSON object from mixed text (Gemma‑style fallback)
function extractJSON(text) {
  if (!text || typeof text !== "string") return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// Main agent endpoint
app.post("/agent/:name", async (req, res) => {
  const name = req.params.name;
  const agent = agents[name];
  if (!agent) return res.status(404).json({ error: "Agent not found" });

  const model = agent.manifest.model;

  let messages = [
    { role: "system", content: agent.manifest.system || "" },
    { role: "user", content: req.body.input || "" },
  ];

  try {
    while (true) {
      const response = await callOllama(messages, model, agent.manifest.tools);
      const msg = response.message || {};

      // 1. Llama 3.1 / Ollama tool_calls path
      const toolCalls = msg.tool_calls || msg.toolCalls;
      if (toolCalls && toolCalls.length > 0) {
        const call = toolCalls[0];

        const fn = call.function || {};
        const toolName = fn.name;
        let args = fn.arguments || {};

        if (typeof args === "string") {
          try {
            args = JSON.parse(args);
          } catch {
            // leave as string if it fails; tool can handle or fail gracefully
          }
        }

        const toolImpl = agent.tools[toolName];
        if (!toolImpl) {
          // Model tried to call a non‑existent tool; tell it and loop
          messages.push({
            role: "assistant",
            content: `Tool ${toolName} not found. Available tools: ${Object.keys(agent.tools).join(
              ", "
            )}`,
          });
          continue;
        }

        console.log(`🐝 h1v3 TOOL INVOKED → ${toolName}`);

        const result = await toolImpl.run(args);

        // Record the tool call + result in the conversation
        messages.push({
          role: "assistant",
          content: "",
          tool_calls: [call],
        });

        messages.push({
          role: "tool",
          name: toolName,
          content: JSON.stringify(result),
        });

        // Loop again so the model can react to the tool result
        continue;
      }

      // 2. Fallback: model emitted a JSON blob with { tool, arguments } (Gemma‑style / old prompt)
      const extracted = extractJSON(msg.content);
      if (extracted && extracted.tool) {
        const toolName = extracted.tool;
        const args = extracted.arguments || {};
        const toolImpl = agent.tools[toolName];

        if (!toolImpl) {
          messages.push({
            role: "assistant",
            content: `Tool ${toolName} not found. Available tools: ${Object.keys(
              agent.tools
            ).join(", ")}`,
          });
          continue;
        }

        const result = await toolImpl.run(args);

        messages.push({
          role: "tool",
          name: toolName,
          content: JSON.stringify(result),
        });

        continue;
      }

      // 3. No tool calls → final answer
      return res.json({ output: msg.content || "" });
    }
  } catch (e) {
    console.error("Runtime error:", e);
    return res.status(500).json({ error: e.message || String(e) });
  }
});

loadAgents();
app.listen(3928, () => console.log("h1v3 runtime listening on 3928"));
