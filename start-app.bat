@echo off

REM Navigate to the frontend directory and start the frontend
cd .\Web-Application-PD
start "" "npm" start

REM Navigate to the backend directory and start the backend
cd .\Web-Application-PD\server
start "" "node" server.js