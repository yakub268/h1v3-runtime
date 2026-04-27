
            // -------------------------------------------------- //
            // --- h1v3-runtime Agent-Runtime Folder Overview --- //
            // -------------------------------------------------- //

OK!

The h1v3-runtime is a dual-folder framework with a built-in agent runtime and agent creation vault.

- The ~/h1v3-runtime folder contains the runtime/ and dashboard/ subdirectories — runtime/ holds runtime.cjs and sessionManager.js (the runtime logic) and dashboard/ holds dashboard.js, index.html and style.css (the dashboard UI).

- The ~/.h1v3 folder contains the agents, agent assets and tools folders (created by the user) and it handles the agents and tools logic:



// ------ ~/h1v3-runtime Folder Structure:
// ---------------------------------------

n3z@n3z-laptop:~/h1v3-runtime$ tree -L 1
.
├── dashboard
├── h1v3-runtime_agent_structure.png
├── h1v3-runtime_logo.png
├── LICENSE
├── Log
├── node_modules
├── package.json
├── package-lock.json
├── README.md
├── READMEs
└── runtime

// ------ ~/.h1v3 Folder Structure:
// --------------------------------

n3z@n3z-laptop:~/.h1v3$ tree -L 4
.
├── agents
│   ├── cron_manager
│   │   ├── agent.js
│   │   ├── agent.json
│   │   ├── sessions
│   │   └── tools
│   │       ├── cronTask.js
│   │       └── parseCronTime.js
│   ├── directory_scout
│   │   ├── agent.js
│   │   ├── agent.json
│   │   ├── sessions
│   │   └── tools
│   │       ├── listDirectory.js
│   │       └── readFile.js
│   ├── ros2_scout
│   │   ├── agent.js
│   │   ├── agent.json
│   │   ├── sessions
│   │   └── tools
│   │       ├── nodeMonitor.js
│   │       ├── serviceMonitor.js
│   │       └── topicMonitor.js
│   ├── vision_scout
│   │   ├── agent.js
│   │   ├── agent.json
│   │   ├── sessions
│   │   └── tools
│   │       ├── build_capture_rgb.sh
│   │       ├── capture_rgb
│   │       ├── capture_rgb.cpp
│   │       ├── captureRGB.js
│   │       ├── Log
│   │       ├── node_modules
│   │       ├── package.json
│   │       ├── package-lock.json
│   │       └── runMoondreamDetection.js
│   ├── vitals_scout
│   │   ├── agent.js
│   │   ├── agent.json
│   │   ├── sessions
│   │   └── tools
│   │       └── systemOverview.js
│   └── wifi_manager
│       ├── agent.js
│       ├── agent.json
│       ├── sessions
│       └── tools
│           └── scanNet.js
├── assets
│   └── agent_pics
│       ├── cron_manager_dark.png
│       ├── cron_manager.png
│       ├── default.png
│       ├── directory_scout.png
│       ├── ros2_scout.png
│       ├── vision_scout.png
│       └── vitals_scout.png
└── docs
    ├── commands
    │   └── talk_to_agent.md
    ├── info
    └── templates
        └── agent_json_template.md