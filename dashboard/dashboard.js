//==============================================================================================//
//                              H1V3-RUNTIME  DASHBOARD CODE                                    //
//==============================================================================================//


//----------⭐Persistent session ID for agent conversations
async function loadDashboard() {
    try {
        // Fetch live models
        const modelRes = await fetch("http://localhost:3928/api/models");
        const modelData = await modelRes.json();

        // Fetch live agents
        const agentRes = await fetch("http://localhost:3928/api/agents");
        const agentData = await agentRes.json();

        // Populate model list
        document.getElementById("model-list").innerHTML =
            modelData.models
                .map(m => `<li class="model-item" data-model="${m}">${m}</li>`)
                .join("");

        document.querySelectorAll(".model-item").forEach(item => {
            item.addEventListener("click", () => {
                const modelName = item.dataset.model;
                openModelPanel(modelName);
            });
        });

        // Populate agent list with clickable items
        document.getElementById("agent-list").innerHTML =
            agentData.agents
                .map(a => `<li class="agent-item" data-agent="${a}">${a}</li>`)
                .join("");

        // Add click handlers for each agent item
        document.querySelectorAll(".agent-item").forEach(item => {
            item.addEventListener("click", () => {
                const agentName = item.dataset.agent;
                openAgentPanel(agentName);
            });
        });

    } catch (err) {
        console.error("Dashboard load error:", err);

        document.getElementById("model-list").innerHTML =
            `<li style="color:red;">Failed to load models</li>`;

        document.getElementById("agent-list").innerHTML =
            `<li style="color:red;">Failed to load agents</li>`;
    }
}
loadDashboard();


//----------⭐Persistent session ID for agent conversations
let currentSessionId = null;


//----------⭐Agent Subwindow Logic
function openAgentPanel(agentName) {
    const panel = document.getElementById("agent-panel");
    const title = document.getElementById("agent-panel-title");
    const status = document.getElementById("agent-status");
    const tools = document.getElementById("agent-tools");
    const pic = document.getElementById("agent-profile-pic");

    // Set panel title
    title.textContent = agentName;

    // Status placeholder
    status.innerHTML = `<b>Status:</b> Idle`;

    // ⭐ Fetch agent info (tools + profile pic) from new endpoint
    fetch(`http://localhost:3928/api/agent/${agentName}/info`)
        .then(res => res.json())
        .then(data => {
            // Tools
            if (data.tools && data.tools.length > 0) {
                tools.innerHTML = `<b>Tools:</b><br>${data.tools.join("<br>")}`;
            } else {
                tools.innerHTML = `<b>Tools:</b> None`;
            }

            // Profile picture
            if (data.profilePic) {
                pic.src = data.profilePic;
                pic.style.display = "block";
            } else {
                pic.src = "assets/agent_pics/default.png";
                pic.style.display = "block";
            }
        })
        .catch(err => {
            console.error("Error fetching agent info:", err);
            tools.innerHTML = `<b>Tools:</b> Error loading tools`;
            pic.src = "assets/agent_pics/default.png";
            pic.style.display = "block";
        });

    // Show the panel
    panel.classList.remove("hidden");

    // Attach send handler
    document.getElementById("agent-send").onclick = async () => {
        const input = document.getElementById("agent-input").value;
        const responseBox = document.getElementById("agent-response");

        // ⭐ Build request body with persistent sessionId
        const body = {
            input,
            sessionId: currentSessionId || undefined
        };

        const res = await fetch(`http://localhost:3928/agent/${agentName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        // ⭐ Store sessionId returned by runtime
        if (data.sessionId) {
            currentSessionId = data.sessionId;
        }

        //const data = await res.json();

        // ⭐ Show avatar next to agent response
        responseBox.innerHTML = `
            <div class="agent-message">
                <img src="${pic.src}" class="profile-pic-small">
                <span>${data.output}</span>
            </div>
        `;
            };
}


//----------⭐Model Subwindow Logic
function openModelPanel(modelName) {
    const panel = document.getElementById("model-panel");
    const title = document.getElementById("model-panel-title");
    const status = document.getElementById("model-status");
    const info = document.getElementById("model-info");
    const pic = document.getElementById("model-profile-pic");

    title.textContent = modelName;

    // ⭐ Fetch model info (status + profile pic + metadata)
    fetch(`http://localhost:3928/api/model/${modelName}/info`)
        .then(res => res.json())
        .then(data => {
            status.innerHTML = `<b>Status:</b> ${data.status || "Loaded"}`;
            info.innerHTML = `<b>Info:</b> ${data.info || "(none)"}`;

            // ⭐ Profile picture
            if (data.profilePic) {
                pic.src = data.profilePic;
                pic.style.display = "block";
            } else {
                pic.src = "/assets/model_pics/default.png";
                pic.style.display = "block";
            }
        })
        .catch(err => {
            console.error("Error fetching model info:", err);
            status.innerHTML = `<b>Status:</b> Error`;
            info.innerHTML = `<b>Info:</b> Could not load metadata`;
            pic.src = "/assets/model_pics/default.png";
            pic.style.display = "block";
        });

    panel.classList.remove("hidden");

    document.getElementById("model-send").onclick = async () => {
        const input = document.getElementById("model-input").value;
        const responseBox = document.getElementById("model-response");

        const res = await fetch(`http://localhost:3928/model/${modelName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input })
        });

        const data = await res.json();

        // ⭐ Show avatar next to model response
        responseBox.innerHTML = `
            <div class="agent-message">
                <img src="${pic.src}" class="profile-pic-small">
                <span>${data.output}</span>
            </div>
        `;
    };
}



//----------⭐Close button handler for Agent Subwindow
document.getElementById("agent-close").addEventListener("click", () => {
    document.getElementById("agent-panel").classList.add("hidden");
    document.getElementById("agent-input").value = "";
    document.getElementById("agent-response").textContent = "";
    currentSessionId = null; // ⭐ Reset session
});


//----------⭐Close button handler for Model Subwindow
document.getElementById("model-close").addEventListener("click", () => {
    document.getElementById("model-panel").classList.add("hidden");
    document.getElementById("model-input").value = "";
    document.getElementById("model-response").textContent = "";
});


//----------⭐Draggable Panel Logic
function makePanelDraggable(panel) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    panel.addEventListener("mousedown", (e) => {
        // Prevent dragging when clicking inside textareas or buttons
        if (e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON") return;

        isDragging = true;
        offsetX = e.clientX - panel.offsetLeft;
        offsetY = e.clientY - panel.offsetTop;
        panel.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        panel.style.left = `${e.clientX - offsetX}px`;
        panel.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        panel.style.cursor = "default";
    });
}


//----------⭐Activate draggable panels
window.addEventListener("DOMContentLoaded", () => {
    makePanelDraggable(document.getElementById("agent-panel"));
    makePanelDraggable(document.getElementById("model-panel"));
});


//----------⭐LIVE LOG STREAM FROM RUNTIME
function startLogStream() {
    const terminal = document.getElementById("terminal");
    const eventSource = new EventSource("http://localhost:3928/logs");

    eventSource.onmessage = (event) => {
        terminal.textContent += event.data + "\n";
        terminal.scrollTop = terminal.scrollHeight; // auto-scroll
    };

    eventSource.onerror = () => {
        terminal.textContent += "[Log stream disconnected]\n";
    };
}


//----------⭐Start the log stream when dashboard loads
window.addEventListener("DOMContentLoaded", () => {
    startLogStream();
});


//----------⭐Sidebar Memory Toggle Logic
document.getElementById("tab-memory").addEventListener("click", () => {
    document.getElementById("memory-content").classList.toggle("hidden");
});


//----------⭐Sidebar Schedule Toggle Logic
document.getElementById("tab-schedule").addEventListener("click", () => {
    document.getElementById("schedule-content").classList.toggle("hidden");
});


//----------⭐MEMORY TAB — GLOBAL MEMORY BROWSER JS
document.getElementById("tab-memory").addEventListener("click", async () => {
    // When Memory tab is opened, load agent list into dropdown
    const dropdown = document.getElementById("memory-agent-dropdown");

    // If already populated, do nothing
    if (dropdown.options.length > 0) return;

    const res = await fetch("http://localhost:3928/api/agents");
    const data = await res.json();

    dropdown.innerHTML = data.agents
        .map(a => `<option value="${a}">${a}</option>`)
        .join("");

    // Auto-load first agent's sessions
    if (data.agents.length > 0) {
        loadSessionsForAgent(data.agents[0]);
    }

    dropdown.addEventListener("change", () => {
        loadSessionsForAgent(dropdown.value);
    });
});


//----------⭐Load Sessions for Selected Agent
async function loadSessionsForAgent(agentName) {
    const container = document.getElementById("session-list-container");
    container.innerHTML = `<p>Loading sessions...</p>`;

    const res = await fetch(`http://localhost:3928/api/agent/${agentName}/sessions`);
    const sessions = await res.json();

    if (sessions.length === 0) {
        container.innerHTML = `<p>No sessions found.</p>`;
        return;
    }

    container.innerHTML = sessions.map(s => `
        <div class="session-entry" data-session="${s.sessionId}" data-agent="${agentName}">
            <b>${s.name}</b><br>
            <small>Created: ${new Date(s.created).toLocaleString()}</small><br>
            <small>Updated: ${new Date(s.updated).toLocaleString()}</small><br>
            <small>Messages: ${s.messages}</small><br><br>

            <button class="session-btn session-view-btn">View</button>
            <button class="session-btn session-rename-btn">Rename</button>
            <button class="session-btn session-delete-btn">Delete</button>
            <button class="session-btn session-export-btn">Export</button>
        </div>
    `).join("");

    // Attach handlers
    document.querySelectorAll(".session-view-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const entry = btn.closest(".session-entry");
            loadSessionViewer(entry.dataset.agent, entry.dataset.session);
        });
    });

    document.querySelectorAll(".session-rename-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const entry = btn.closest(".session-entry");
            renameSession(entry.dataset.agent, entry.dataset.session);
        });
    });

    document.querySelectorAll(".session-delete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const entry = btn.closest(".session-entry");
            deleteSession(entry.dataset.agent, entry.dataset.session);
        });
    });

    document.querySelectorAll(".session-export-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const entry = btn.closest(".session-entry");
            exportSession(entry.dataset.agent, entry.dataset.session);
        });
    });
}


//----------⭐Load Session Viewer
async function loadSessionViewer(agentName, sessionId) {
    const viewer = document.getElementById("session-viewer-content");
    viewer.innerHTML = `<p>Loading session...</p>`;

    const res = await fetch(`http://localhost:3928/api/agent/${agentName}/session/${sessionId}`);
    const data = await res.json();

    viewer.innerHTML = `
        <h4>Session: ${data.metadata.name}</h4>
        <p><b>Created:</b> ${new Date(data.metadata.created).toLocaleString()}</p>
        <p><b>Updated:</b> ${new Date(data.metadata.updated).toLocaleString()}</p>
        <hr>

        <h4>Messages</h4>
        ${data.messages.map(m => `
            <div style="margin-bottom:10px;">
                <b>${m.role.toUpperCase()}:</b><br>
                <pre>${m.content || "(no content)"}</pre>
            </div>
        `).join("")}

        <hr>
        <h4>State Machine</h4>
        <pre>${JSON.stringify(data.state, null, 2)}</pre>
    `;
}


//----------⭐Rename Session
async function renameSession(agentName, sessionId) {
    const newName = prompt("Enter new session name:");

    if (!newName) return;

    await fetch(`http://localhost:3928/api/agent/${agentName}/session/${sessionId}/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName })
    });

    loadSessionsForAgent(agentName);
}


//----------⭐Delete Session
async function deleteSession(agentName, sessionId) {
    if (!confirm("Delete this session?")) return;

    await fetch(`http://localhost:3928/api/agent/${agentName}/session/${sessionId}`, {
        method: "DELETE"
    });

    loadSessionsForAgent(agentName);

    // Clear viewer if it was showing this session
    const viewer = document.getElementById("session-viewer-content");
    viewer.innerHTML = `<p class="session-viewer-placeholder">Select a session to view its contents.</p>`;
}


//----------⭐Export Session
async function exportSession(agentName, sessionId) {
    const res = await fetch(`http://localhost:3928/api/agent/${agentName}/session/${sessionId}`);
    const data = await res.json();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${agentName}_${sessionId}.json`;
    a.click();

    URL.revokeObjectURL(url);
}


//----------⭐DRAGGABLE SIDEBAR LOGIC
(function enableSidebarResize() {
    const sidebar = document.getElementById("sidebar");
    const resizer = document.getElementById("sidebar-resizer");

    let isDragging = false;

    resizer.addEventListener("mousedown", () => {
        isDragging = true;
        document.body.style.cursor = "ew-resize";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const newWidth = Math.max(200, Math.min(2000, e.clientX));

        sidebar.style.width = newWidth + "px";
        resizer.style.left = newWidth + "px";

        // Shift main content
        //document.querySelectorAll("#container, #columns, #agent-panel, #model-panel, #logo, #terminal-container")
        //    .forEach(el => {
        //        el.style.marginLeft = (newWidth + 20) + "px";
        //    });
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        document.body.style.cursor = "default";
    });
})();
