const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");

const AGENT_ROOT = path.join(process.env.HOME || process.env.HOMEPATH || ".", ".h1v3", "agents");
const app = express();

// ⭐ Serve static assets (agent pics, etc.)
app.use("/assets", express.static(path.join(process.env.HOME, ".h1v3/assets")));

app.use(express.json());

// Allow dashboard (3030) to call runtime API (3928)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3030");
  res.header("Access-Control-Allow-Methods", "GET,POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

let agents = {};


// --- DASHBOARD SERVER Test Block ---
function launchDashboard() {
  const http = require("http");
  const { spawn } = require("child_process");

  const DASHBOARD_PORT = 3030;
  const dashboardDir = path.join(process.cwd(), "dashboard");

  // Serve static dashboard files + agent pics
  const server = http.createServer((req, res) => {
      let filePath;

      // ⭐ Serve agent profile pictures from ~/.h1v3/assets
      if (req.url.startsWith("/assets/")) {
          filePath = path.join(process.env.HOME, ".h1v3", req.url);
      } else {
          // Serve dashboard files from ./dashboard
          filePath = path.join(
              dashboardDir,
              req.url === "/" ? "index.html" : req.url
          );
      }

      fs.readFile(filePath, (err, data) => {
          if (err) {
              res.writeHead(404);
              return res.end("Not found");
          }
          res.writeHead(200);
          res.end(data);
      });
  });


  server.listen(DASHBOARD_PORT, () => {
    console.log(`📊 h1v3 dashboard running at http://localhost:${DASHBOARD_PORT}`);

    // Auto-open window
    const opener =
      process.platform === "win32"
        ? "start"
        : process.platform === "darwin"
        ? "open"
        : "xdg-open";

    spawn(opener, [`http://localhost:${DASHBOARD_PORT}`]);
  });
}
// ----------------------------------------------


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


// Main agent and model endpoints

// agent to dashboard API endpoint
app.get("/api/agents", (req, res) => {
  res.json({ agents: Object.keys(agents) });
});

// model to dashboard API endpoint
app.get("/api/models", async (req, res) => {
  try {
    const result = await axios.get("http://localhost:11434/api/tags");
    const models = result.data.models.map(m => m.name);
    res.json({ models });
  } catch (e) {
    console.error("Error fetching models:", e);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

// ⭐⭐⭐ NEW MODEL CHAT ENDPOINT ⭐⭐⭐
app.post("/model/:name", async (req, res) => {
  try {
    const modelName = req.params.name;
    const userInput = req.body.input;

    const messages = [
      { role: "user", content: userInput }
    ];

    // Call Ollama directly using your existing function
    const result = await callOllama(messages, modelName, null);

    // Return the model's output
    res.json({ output: result.message.content });
  } catch (err) {
    console.error("Model chat error:", err);
    res.status(500).json({ error: "Model chat failed" });
  }
});

// Return agent info (tools + profile pic)
app.get("/api/agent/:name/info", (req, res) => {
  const name = req.params.name;
  const agent = agents[name];

  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  const toolNames = Object.keys(agent.tools || {});
  const profilePic = agent.manifest.profilePic || "assets/agent_pics/default.png";

  res.json({
    tools: toolNames,
    profilePic
  });
});

// ⭐⭐⭐ END NEW MODEL CHAT ENDPOINT ⭐⭐⭐

// ----------------------------------------TEST
// Return an agent's tools to the dashboard
app.get("/api/agent/:name/tools", (req, res) => {
  const name = req.params.name;
  const agent = agents[name];

  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  const toolNames = Object.keys(agent.tools || {});
  res.json({ tools: toolNames });
});
// --------------------------TEST

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
launchDashboard();
app.listen(3928, () => console.log("h1v3 runtime listening on 3928"));
