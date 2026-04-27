
                            // --- Note on h1v3-runtime --- //

OK! So the h1v3-runtime is actually a dual folder architecture, with the ~/h1v3-runtime folder (created by the user) containing runtime.cjs, dashboard.js, index.html, and the style.css and the ~/.h1v3 folder containing the agents and tools. Here is the structure of the ~/h1v3-runtime folder with the dashboard.js, index.html, and style.css living in the dashboard folder:

username:~/h1v3-runtime$ tree -L 1
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
└── runtime.cjs

And here is the folder structure of the ~/.h1v3 folder:

username:~/.h1v3$ tree -L 4
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

