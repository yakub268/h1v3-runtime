//==============================================================================================//
//                              H1V3-RUNTIME  MAIN CODE                                         //
//==============================================================================================//


const express = require("express"); // import Express.js for Server
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");
const AGENT_ROOT = path.join(process.env.HOME || process.env.HOMEPATH || ".", ".h1v3", "agents");
const app = express();
const logSubscribers = [];
const logBuffer = []; // store last 200 log lines
const originalLog = console.log;
//===================================================




//----------⭐Logging Sub-System
function broadcastToDashboard(msg) {
  for (const client of logSubscribers) {
    client.write(`data: ${msg}\n\n`);
  }
}


//----------⭐Save & Broadcast
console.log = function (...args) {
  const msg = args.join(" ");
  originalLog(msg);

  // ⭐ Save to buffer
  logBuffer.push(msg);
  if (logBuffer.length > 200) logBuffer.shift(); // keep last 200 lines

  // ⭐ Broadcast to connected dashboards
  broadcastToDashboard(msg);
};


//----------⭐Serve static assets (agent pics, etc.)
app.use("/assets", express.static(path.join(process.env.HOME, ".h1v3/assets")));
app.use(express.json());


//----------⭐(CORS middleware) Allow dashboard (3030) to call runtime API (3928)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3030");
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
let agents = {};


// ⭐ Model Metadata Registry (Profile Pic etc)
const models = {
    "moondream:latest": {
        profilePic: "/assets/model_pics/moondream.png",
        info: "Moondream Vision Model (1.7 GB)"
    },
    "qwen2.5:7b-instruct": {
        profilePic: "/assets/model_pics/qwen2.5_7b.png",
        info: "Qwen 2.5, 7B Instruct (4.7 GB)"
    },
    "llama3.1:8b": {
        profilePic: "/assets/model_pics/llama3.1_8b.png",
        info: "Meta LLaMA 3.1, 8B (4.9 GB)"
    },
    "gemma3n:e2b": {
        profilePic: "/assets/model_pics/gemma3n_e2b.png",
        info: "Gemma 3n, E2B Edition (5.6 GB)"
    }
};


//----------⭐Launch Dashboard Server
function launchDashboard() {
  const http = require("http");
  const { spawn } = require("child_process");

  const DASHBOARD_PORT = 3030;
  const dashboardDir = path.join(__dirname, "../dashboard");

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

          // ⭐ Set correct MIME types
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes = {
              ".html": "text/html",
              ".css": "text/css",
              ".js": "application/javascript",
              ".png": "image/png",
              ".jpg": "image/jpeg",
              ".jpeg": "image/jpeg",
              ".svg": "image/svg+xml"
          };

          const contentType = mimeTypes[ext] || "application/octet-stream";

          res.writeHead(200, { "Content-Type": contentType });
          res.end(data);
      });
  });

console.log("DashboardDir:", dashboardDir);


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


//----------⭐Load ALL agents from ~/.h1v3/agents
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
    console.log(`Loaded Agent: ${name}`);
  }
  console.log("// --- Agent Swarm Initialized.. --- //");
}


//----------⭐Watch for changes and hot‑reload
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


//----------⭐Wrap tools in OpenAI/Ollama function schema
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


//----------⭐Call Ollama chat API
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


//----------⭐Extract first JSON Object from mixed-text (Gemma‑style fallback)
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


//----------⭐Session Metadata (index.json)
function getIndexPath(agentName) {
  return path.join(AGENT_ROOT, agentName, "sessions", "index.json");
}
function loadIndex(agentName) {
  const indexPath = getIndexPath(agentName);

  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, JSON.stringify({}, null, 2));
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(indexPath, "utf8"));
  } catch (err) {
    console.error("Error reading index.json:", err);
    return {};
  }
}
function saveIndex(agentName, indexObj) {
  const indexPath = getIndexPath(agentName);
  fs.writeFileSync(indexPath, JSON.stringify(indexObj, null, 2));
}


//----------⭐SSE (Server‑Sent Events) TERMINAL LOG-STREAM Endpoint
app.get("/logs", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Allow browser auto-reconnect
  res.write("retry: 1000\n\n");

  // ⭐ Send buffered logs immediately
  for (const line of logBuffer) {
    res.write(`data: ${line}\n\n`);
  }

  // ⭐ Add this client to the subscriber list
  logSubscribers.push(res);

  // Remove client on disconnect
  req.on("close", () => {
    const idx = logSubscribers.indexOf(res);
    if (idx !== -1) logSubscribers.splice(idx, 1);
  });
});
console.log("// --- SSE Endpoint Initialized.. --- //");


//----------⭐Agent to Dashboard API Endpoint
app.get("/api/agents", (req, res) => {
  res.json({ agents: Object.keys(agents) });
});




//----------⭐Model to Dashboard API Endpoint
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


// ⭐ NEW: Model Info Endpoint
app.get("/api/model/:name/info", (req, res) => {
    const name = req.params.name;
    const model = models[name];

    if (!model) {
        return res.status(404).json({ error: "Model not found" });
    }

    res.json({
        status: "Loaded",
        profilePic: model.profilePic || "assets/model_pics/default.png",
        info: model.info || "No additional info"
    });
});


//----------⭐System Metrics Endpoint
app.get("/api/metrics", (req, res) => {
  const os = require("os");
  const { execSync } = require("child_process");

  try {
    // CPU usage (simplified: average load)
    const loadAvg = os.loadavg()[0]; // 1-minute load average
    const cpuCount = os.cpus().length;
    const cpuPercent = Math.min(100, Math.round((loadAvg / cpuCount) * 100));

    // RAM
    const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024)); // GB
    const freeMem = Math.round(os.freemem() / (1024 * 1024 * 1024)); // GB
    const usedMem = totalMem - freeMem;

    // Disk (simplified: root filesystem)
    let diskUsed = 0;
    let diskTotal = 0;
    try {
      const dfOutput = execSync("df / | tail -1", { encoding: "utf8" });
      const parts = dfOutput.trim().split(/\s+/);
      diskUsed = Math.round(parseInt(parts[2]) / (1024 * 1024)); // GB
      diskTotal = Math.round(parseInt(parts[1]) / (1024 * 1024)); // GB
    } catch (e) {
      // Fallback if df fails
      diskUsed = 0;
      diskTotal = 512; // placeholder
    }

    // GPU (NVIDIA only, placeholder if not available)
    let gpuPercent = 0;
    try {
      const nvidiaOutput = execSync("nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits", { encoding: "utf8" });
      gpuPercent = parseInt(nvidiaOutput.trim().split('\n')[0]) || 0;
    } catch (e) {
      // No NVIDIA GPU or nvidia-smi not available
      gpuPercent = 0;
    }

    // VRAM (placeholder, would need more complex parsing)
    const vramUsed = 0; // Placeholder
    const vramTotal = 8; // Placeholder

    // Network (simplified, placeholder)
    const netDown = 0; // MB/s
    const netUp = 0; // MB/s

    res.json({
      cpu: cpuPercent,
      gpu: gpuPercent,
      ram: { used: usedMem, total: totalMem },
      vram: { used: vramUsed, total: vramTotal },
      disk: { used: diskUsed, total: diskTotal },
      network: { down: netDown, up: netUp }
    });

  } catch (err) {
    console.error("Error fetching metrics:", err);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});


//----------⭐Model Chat Endpoint
app.post("/model/:name", async (req, res) => {
  try {
    const modelName = req.params.name;
    const userInput = req.body.input;

    const messages = [
      { role: "user", content: userInput }
    ];

    // Call Ollama directly using your existing function
    const result = await callOllama(messages, modelName, null);

    // ⭐ Compute tokens/sec (basic per-generation metric)
    let tokensPerSecond = null;

    if (result.eval_count && result.eval_duration) {
      const seconds = result.eval_duration / 1e9; // convert ns → seconds
      tokensPerSecond = (result.eval_count / seconds).toFixed(2);
    }

    // Return the model's output + TPS
    res.json({
      output: result.message.content,
      tokensPerSecond
    });

  } catch (err) {
    console.error("Model chat error:", err);
    res.status(500).json({ error: "Model chat failed" });
  }
});



//----------⭐Return Agent Info (tools + profile pic)
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


//----------⭐Return an agent's tools to the dashboard
app.get("/api/agent/:name/tools", (req, res) => {
  const name = req.params.name;
  const agent = agents[name];

  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  const toolNames = Object.keys(agent.tools || {});
  res.json({ tools: toolNames });
});




//----------⭐Agent Execution Endpoint (with persistent memory !! )
app.post("/agent/:name", async (req, res) => {
  

  const taskStart = Date.now(); // NEW TEST CODE


  const name = req.params.name;
  const agent = agents[name];
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  const model = agent.manifest.model;
  // --- Load or create session ---
  const { sessionId } = req.body;
  const sid = sessionId || Date.now().toString();
  const { loadSession, saveSession } = require("./sessionManager");
  let session = loadSession(name, sid);
  let messages = session.messages;
  // Inject system prompt if this is a new session
  if (messages.length === 0) {
    messages.push({ role: "system", content: agent.manifest.system || "" });
  }
  console.log(`🧠 Loaded memory for session ${sessionId} (${messages.length} messages)`);
  // Add the new user message
  messages.push({ role: "user", content: req.body.input || "" });
  // Persist immediately
  session.messages = messages;
  saveSession(name, session);
  console.log(`💾 Saved memory for session ${sessionId}`);

  try {
    let tokensPerSecond = null;
    
    while (true) {
      
      const response = await callOllama(messages, model, agent.manifest.tools);
      const msg = response.message || {};



      // ⭐ Capture TPS from this model call--------NEW TEST CODE
      if (response.eval_count && response.eval_duration) {
          const seconds = response.eval_duration / 1e9;
          tokensPerSecond = (response.eval_count / seconds).toFixed(2);
      }
      


      // --- 1. Llama 3.1 / Ollama tool_calls path ---
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
            // leave as string if parsing fails
          }
        }
        const toolImpl = agent.tools[toolName];
        if (!toolImpl) {
          messages.push({
            role: "assistant",
            content: `Tool ${toolName} not found. Available tools: ${Object.keys(agent.tools).join(", ")}`,
          });
          // Persist
          session.messages = messages;
          saveSession(name, session);
          continue;
        }
        console.log(`🐝 h1v3 TOOL INVOKED → ${toolName}`);
        const result = await toolImpl.run(args);
        // Record the tool call
        messages.push({
          role: "assistant",
          content: "",
          tool_calls: [call],
        });
        // Record the tool result
        messages.push({
          role: "tool",
          name: toolName,
          content: JSON.stringify(result),
        });
        // Persist after tool result
        session.messages = messages;
        saveSession(name, session);
        continue;
      }

      // --- 2. Fallback: Gemma-style { tool, arguments } JSON ---
      const extracted = extractJSON(msg.content);
      if (extracted && extracted.tool) {
        const toolName = extracted.tool;
        const args = extracted.arguments || {};
        const toolImpl = agent.tools[toolName];
        if (!toolImpl) {
          messages.push({
            role: "assistant",
            content: `Tool ${toolName} not found. Available tools: ${Object.keys(agent.tools).join(", ")}`,
          });
          session.messages = messages;
          saveSession(name, session);
          continue;
        }
        const result = await toolImpl.run(args);
        messages.push({
          role: "tool",
          name: toolName,
          content: JSON.stringify(result),
        });
        session.messages = messages;
        saveSession(name, session);
        continue;
      }

      // --- 3. No tool calls → final answer ---
      const finalAnswer = msg.content || "";
      messages.push({ role: "assistant", content: finalAnswer });
      // Persist final answer
      session.messages = messages;
      saveSession(name, session);
      
      // ⭐ Compute total task duration------------NEW TEST CODE
      const taskDurationMs = Date.now() - taskStart;      
      
      return res.json({
        output: finalAnswer,
        sessionId: sid,
        tokensPerSecond,
        taskDurationMs
      });
    }
  } catch (e) {
    console.error("Runtime error:", e);
    // Persist error state
    session.state = {
      status: "error",
      lastError: e.message || String(e)
    };
    saveSession(name, session);
    return res.status(500).json({ error: e.message || String(e) });
  }
});


//----------⭐Session Listing Endpoint
app.get("/api/agent/:name/sessions", (req, res) => {
  const agentName = req.params.name;
  const sessionDir = path.join(AGENT_ROOT, agentName, "sessions");

  if (!fs.existsSync(sessionDir)) {
    return res.json([]);
  }

  const index = loadIndex(agentName);
  const files = fs.readdirSync(sessionDir).filter(f => f.endsWith(".json") && f !== "index.json");

  const sessions = files.map(file => {
    const sessionId = file.replace(".json", "");
    const sessionPath = path.join(sessionDir, file);

    let messageCount = 0;
    try {
      const data = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
      messageCount = data.messages?.length || 0;
    } catch {}

    return {
      sessionId,
      name: index[sessionId]?.name || sessionId,
      created: index[sessionId]?.created || Number(sessionId),
      updated: index[sessionId]?.updated || Number(sessionId),
      messages: messageCount
    };
  });

  res.json(sessions);
});

//----------⭐Get Full Session
app.get("/api/agent/:name/session/:id", (req, res) => {
  const agentName = req.params.name;
  const sessionId = req.params.id;

  const sessionPath = path.join(AGENT_ROOT, agentName, "sessions", `${sessionId}.json`);

  if (!fs.existsSync(sessionPath)) {
    return res.status(404).json({ error: "Session not found" });
  }

  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  const index = loadIndex(agentName);

  res.json({
    ...session,
    metadata: index[sessionId] || {}
  });
});

//----------⭐Rename Session (metadata only)
app.post("/api/agent/:name/session/:id/rename", (req, res) => {
  const agentName = req.params.name;
  const sessionId = req.params.id;
  const newName = req.body.name;

  if (!newName || newName.trim() === "") {
    return res.status(400).json({ error: "Invalid name" });
  }

  const index = loadIndex(agentName);

  if (!index[sessionId]) {
    index[sessionId] = {
      name: sessionId,
      created: Number(sessionId),
      updated: Date.now()
    };
  }

  index[sessionId].name = newName.trim();
  index[sessionId].updated = Date.now();

  saveIndex(agentName, index);

  console.log(`📝 Renamed session ${sessionId} → "${newName}"`);

  res.json({ success: true });
});

//----------⭐Delete Session
app.delete("/api/agent/:name/session/:id", (req, res) => {
  const agentName = req.params.name;
  const sessionId = req.params.id;

  const sessionPath = path.join(AGENT_ROOT, agentName, "sessions", `${sessionId}.json`);
  const index = loadIndex(agentName);

  if (fs.existsSync(sessionPath)) {
    fs.unlinkSync(sessionPath);
  }

  if (index[sessionId]) {
    delete index[sessionId];
    saveIndex(agentName, index);
  }

  console.log(`🗑️ Deleted session ${sessionId}`);

  res.json({ success: true });
});




loadAgents();
launchDashboard();
app.listen(3928, () => console.log("🤖 h1v3-runtime listening on port 3928 🤖"));
console.log("// --- H1V3-RT ACTIVE --- //");