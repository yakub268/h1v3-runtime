//==============================================================================================//
//                              H1V3-RUNTIME  SESSION MANAGER CODE                              //
//==============================================================================================//


const fs = require("fs");
const path = require("path");
const AGENT_ROOT = path.join(process.env.HOME || process.env.HOMEPATH || ".", ".h1v3", "agents");




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


//----------⭐Session Filepath
function sessionPath(agentName, sessionId) {
  return path.join(AGENT_ROOT, agentName, "sessions", `${sessionId}.json`);
}


//----------⭐Load Session
function loadSession(agentName, sessionId) {
  const p = sessionPath(agentName, sessionId);

  if (!fs.existsSync(p)) {
    return {
      sessionId,
      messages: [],
      state: {
        status: "idle",
        step: 0,
        lastTool: null,
        lastError: null
      }
    };
  }

  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (err) {
    console.error("Failed to load session:", err);
    return {
      sessionId,
      messages: [],
      state: {
        status: "idle",
        step: 0,
        lastTool: null,
        lastError: null
      }
    };
  }
}


//----------⭐Save Session + Metadata
function saveSession(agentName, session) {
  const p = sessionPath(agentName, session.sessionId);
  const dir = path.dirname(p);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Save session file
  try {
    fs.writeFileSync(p, JSON.stringify(session, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save session:", err);
  }

  // Load metadata index
  const index = loadIndex(agentName);

  // Create or update metadata entry
  if (!index[session.sessionId]) {
    index[session.sessionId] = {
      name: session.sessionId,        // default human-readable name
      created: Number(session.sessionId),
      updated: Date.now()
    };
  } else {
    index[session.sessionId].updated = Date.now();
  }

  // Save metadata index
  saveIndex(agentName, index);
}


module.exports = {
  loadSession,
  saveSession
};
