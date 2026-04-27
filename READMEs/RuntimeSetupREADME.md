====================================================================
====================================================================
====================================================================



<p align="center">
  <img src="h1v3-runtime_logo.png" alt="h1v3-runtime logo" width="640">
</p>



📄 RuntimeSetupREADME.md

A step-by-step guide to setting up dependencies and installing your h1v3-runtime!



h1v3-runtime — First-Time Setup Guide

Welcome to the h1v3-runtime Setup Guide. This guide walks you from zero → fully running the h1v3-runtime ready to command your h1v3 of tool calling agents that utilize a locally hosted LLM model on your machine!
Yay you..

The goal:

    Clone the runtime

    Install dependencies

    Create the hidden ~/.h1v3 directory

    Verify everything works



====================================================================
1. Clone the h1v3-runtime repository

Open a terminal and run:

- git clone https://github.com/dillonfaulk/h1v3-runtime.git

Enter the super awesome directory you just cloned. This folder contains the runtime engine (runtime.cjs) and the package manifest:

- cd ~/h1v3-runtime



====================================================================
2. Install Node.js

Check your current Node version with:

- node -v


Next, download and run setup script:

- curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -


Then for system-wide installation:

- sudo apt-get install -y nodejs



====================================================================
3. Install required JavaScript libraries

Inside the ~/h1v3-runtime folder, install the dependencies:

- npm install express axios chokidar



====================================================================
4. Create the hidden hive directory (~/.h1v3)

The runtime expects a hidden folder in your home directory.



<p align="center">
  <img src="h1v3-runtime_agent_structure.png" alt="h1v3-runtime agent structure" width="300">
</p>



Run these commands to create your agent's home:

- cd 

then..

- mkdir -p ~/.h1v3/agents/dir_scout/tools

then..

- mkdir -p ~/.h1v3/agents/dir_scout/sessions

This folder is your local h1v3 state.
Every agent you create lives here so keep it tidy!



====================================================================
5. Start the h1v3 runtime !!

Enter the ~/h1v3-runtime/ directory and run the command:

- node runtime.cjs

You should see:

Loaded agent: dir_scout
h1v3 runtime listening on 3928

Well done fellow h1v3 builder, you're agent runtime is running and you're agent is waiting for your command. Lets see how to talk to our agent.



====================================================================
6. Command your agent

Lets test our dir_scout agent with this command (replace your-username with your actual username):

Open a 2nd terminal (runtime occupies 1st terminal) a run this command:

curl -X POST http://localhost:3928/agent/dir_scout \
  -H "Content-Type: application/json" \
  -d '{"input": "List the files in /home/your-username/Documents."}'


You should see your agent call the tool (in the runtime terminal) and your agent's output in the 2nd terminal shell.

Terminal #1 (runtime.cjs terminal) output:

🐝 h1v3 TOOL INVOKED → listDirectory

Terminal #2 (agent invocation terminal) output:

{"output":"The files in /home/your-username/Documents are as follows: Kit, NoMachine, SavedTerminalOutput, box_with_physics.usda, your_awful_code.py, your_stuff.txt."}



Yay you have h1v3 agents that call tools!

Have fun and be safe your agents are only as powerful as you make them and only have access to what you give them access to.



--- n3z ---



<p align="center">
  <img src="h1v3-runtime_logo.png" alt="h1v3-runtime logo" width="640">
</p>



====================================================================
====================================================================
====================================================================