

                --- Talk to your agent ---

Once your runtime is running in one terminal, you can interact with any agent using a simple curl POST request.

In another terminal run the command:

curl -X POST http://localhost:3928/agent/directory_scout \
  -H "Content-Type: application/json" \
  -d '{"input": "List the files in /home/<your-username>"}'


If everything is set up correctly, you’ll receive a JSON response containing the agent’s final answer.


