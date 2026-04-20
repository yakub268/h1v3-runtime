

                --- Talk to your agent ---

Once your runtime is running in one terminal, you can interact with any agent using a simple curl POST request.

In another terminal run the command:

curl -X POST http://localhost:3928/agent/directory_scout \
  -H "Content-Type: application/json" \
  -d '{"input": "List the files in /home/<your-username>"}'


                    OR


curl -X POST http://localhost:3928/agent/wifi_manager \
  -H "Content-Type: application/json" \
  -d '{"input":"Scan for available WiFi networks and list them for me in a readable format."}'


                    OR


curl -X POST http://localhost:3928/agent/vitals_scout \
  -H "Content-Type: application/json" \
  -d '{"input":"Check my system vitals and summarize them for me."}'


                    OR


curl -X POST http://localhost:3928/agent/cron_manager \
  -H "Content-Type: application/json" \
  -d '{"input":"Schedule /home/n3z/agent_test.py to run at 11:50am MST."}'



If everything is set up correctly, you’ll receive a JSON response containing the agent’s final answer.


