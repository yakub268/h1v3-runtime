====================================================================
====================================================================
====================================================================



<p align="center">
  <img src="h1v3-runtime_logo.png" alt="h1v3-runtime logo" width="640">
</p>



Documentation Order (Read in this order!):
01.) OllamaSetupREADME.md
02.) RuntimeSetupREADME.md
03.) AgentSetupREADME.md



OllamaSetupREADME.md

A complete guide to installing Ollama, Node.js, npm, VSCode, and pulling local models for the h1v3-runtime.



====================================================================
1. Install Node.js 22

The h1v3-runtime requires Node.js 22.x.

Check your current version in terminal with command:

- node -v

If it’s not 22.x, download the correct version from:

https://nodejs.org

Choose the LTS or Current release that matches Node 22.



====================================================================
2. Install npm 10.9.7

npm is bundled with Node, but you can verify:

- npm -v

If you need to update:

- npm install -g npm@10.9.7



====================================================================
3. Install VSCode

VSCode is the recommended editor for working inside ~/.h1v3.

Download it here:

https://code.visualstudio.com

After installation, verify the code command works with command:

- code --version

or just use nano or Vim or gedit like a monster..



====================================================================
5. Install Git

Git is required to clone the h1v3-runtime repository.

Linux (Debian/Ubuntu):

- sudo apt-get install -y git

macOS (with Homebrew):

- brew install git

Windows:

Download the installer from https://git-scm.com/download/win

Verify installation with:

- git --version


====================================================================
6. Install Ollama

Ollama is the local model server used by the h1v3-runtime.

Install it with this one-liner:

- curl -fsSL https://ollama.com/install.sh | sh

Verify installation version with command:

- ollama --version

This script automatically detects your distro and sets up Ollama as a systemd service for automatic startup.



====================================================================
7. Pull recommended models

The h1v3-runtime works with any model Ollama supports, but these are the recommended baseline models for development.

Run these commands for each model you want in your h1v3. Choose carefully.. its the brain!

Validated Models:
- ollama pull qwen2.5:7b-instruct

- ollama pull gemma3n:e2b

- ollama pull llama3.1:8b

UnValidated Models:
- ollama pull mistral-nemo:12b-instruct

- ollama pull deepseek-r1:7b

- ollama pull phi3:3.8b

Now, verify your Ollama models with the command:

- ollama list



====================================================================
8. Test drive a model manually

Before connecting Ollama to the h1v3-runtime, test each model directly:

- ollama run qwen2.5:7b-instruct

or run ..

- ollama run gemma3n:e2b

or..

- ollama run llama3.1:8b

Then type:

- Hello, I make robots.

You should get a response from the model. If not, one of you is being dumb.. probably the model.

Exit with:

- /bye



====================================================================
9. Confirm Ollama is reachable by the runtime

The h1v3-runtime expects Ollama to be available at:

http://127.0.0.1:11434

To Test it run the command:

- curl http://127.0.0.1:11434/api/tags


You should see a JSON list of your models. If you do, Ollama is fully operational.

Proceed young wizard to:

RuntimeSetupREADME.md 

then afterwards, to..

AgentSetupREADME.md

setup docs.



<p align="center">
  <img src="h1v3-runtime_logo.png" alt="h1v3-runtime logo" width="640">
</p>



====================================================================
====================================================================
====================================================================