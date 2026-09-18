#!/usr/bin/env bash
# GridSense Launcher for macOS / Linux
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================="
echo "    Starting GridSense AI (Backend + Frontend)   "
echo "=================================================="

# Free up ports 8000 and 3000 if previously occupied
echo "Checking and freeing ports 8000 and 3000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
fi

# Check frontend node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Function to stop background processes on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $(jobs -p) 2>/dev/null || true
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    echo "Done."
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start backend
echo "[1/2] Launching Backend on http://localhost:8000 ..."
./venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload &

# 2. Start frontend
echo "[2/2] Launching Frontend on http://localhost:3000 ..."
cd frontend
npm run dev -- --port 3000 &

wait
