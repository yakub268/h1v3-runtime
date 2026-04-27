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


// --- Agent Subwindow Logic ---
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

        const res = await fetch(`http://localhost:3928/agent/${agentName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input })
        });

        const data = await res.json();

        // ⭐ Show avatar next to agent response
        responseBox.innerHTML = `
            <div class="agent-message">
                <img src="${pic.src}" class="profile-pic-small">
                <span>${data.output}</span>
            </div>
        `;
    };
}

// --- Model Subwindow Logic ---
function openModelPanel(modelName) {
    const panel = document.getElementById("model-panel");
    const title = document.getElementById("model-panel-title");
    const status = document.getElementById("model-status");
    const info = document.getElementById("model-info");

    title.textContent = modelName;

    // Placeholder values — we can wire these to live model metadata later
    status.innerHTML = `<b>Status:</b> Loaded`;
    info.innerHTML = `<b>Info:</b> (coming soon)`;

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
        responseBox.textContent = data.output;
    };
}

// Close button handler for Agent Subwindow
document.getElementById("agent-close").addEventListener("click", () => {
    document.getElementById("agent-panel").classList.add("hidden");
    document.getElementById("agent-input").value = "";
    document.getElementById("agent-response").textContent = "";
});

// Close button handler for Model Subwindow
document.getElementById("model-close").addEventListener("click", () => {
    document.getElementById("model-panel").classList.add("hidden");
    document.getElementById("model-input").value = "";
    document.getElementById("model-response").textContent = "";
});

// --- Draggable Panel Logic ---
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


// --- Activate draggable panels ---
window.addEventListener("DOMContentLoaded", () => {
    makePanelDraggable(document.getElementById("agent-panel"));
    makePanelDraggable(document.getElementById("model-panel"));
});