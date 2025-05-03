#!/bin/bash

echo "Starting Web Application on Raspberry Pi..."

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null
    return $?
}

# Kill any existing processes on our ports
for port in 3000 5000 5001; do
    if check_port $port; then
        echo "Killing process on port $port"
        fuser -k $port/tcp
    fi
done

# Start Node.js server
echo "Starting Node.js server..."
cd server
node server.js &
NODE_PID=$!

# Wait for Node.js server to start
sleep 5

# Start Python Flask server
echo "Starting Python Flask server..."
python3 app.py &
FLASK_PID=$!

# Wait for Flask server to start
sleep 5

# Start React development server
echo "Starting React frontend..."
cd ..
npm start &
REACT_PID=$!

# Store PIDs in a file for cleanup
echo "$NODE_PID $FLASK_PID $REACT_PID" > .server_pids

echo "All services started!"
echo "React Frontend: http://localhost:3000"
echo "Node Backend: http://localhost:5000"
echo "Python Flask: http://localhost:5001"

# Handle script termination
cleanup() {
    echo "Shutting down servers..."
    kill $NODE_PID $FLASK_PID $REACT_PID 2>/dev/null
    rm .server_pids 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Keep script running and monitor processes
while true; do
    if ! ps -p $NODE_PID > /dev/null || ! ps -p $FLASK_PID > /dev/null || ! ps -p $REACT_PID > /dev/null; then
        echo "One of the servers crashed. Shutting down..."
        cleanup
    fi
    sleep 5
done
