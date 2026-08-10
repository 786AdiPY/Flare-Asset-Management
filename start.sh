#!/usr/bin/env bash

# ==============================================================================
# AI-Asset Router - Arch Linux Launch Script
# Starts both FastAPI Backend (port 8000) and Next.js Frontend (port 3000)
# ==============================================================================

set -e

# Resolve repository root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo -e "\033[1;34m[AI-Asset Router]\033[0m Starting application on Arch Linux..."

# Ensure backend .env exists
if [ ! -f "$ROOT_DIR/backend/.env" ]; then
    echo -e "\033[1;33m[Backend]\033[0m Creating backend/.env from .env.example..."
    cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
fi

# Ensure frontend .env.local exists
if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
    echo -e "\033[1;33m[Frontend]\033[0m Creating frontend/.env.local from .env.example..."
    cp "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env.local"
fi

# Setup python venv if needed
if [ ! -d "$ROOT_DIR/backend/.venv" ]; then
    echo -e "\033[1;33m[Backend]\033[0m Creating Python virtual environment..."
    python3 -m venv "$ROOT_DIR/backend/.venv"
    source "$ROOT_DIR/backend/.venv/bin/activate"
    echo -e "\033[1;33m[Backend]\033[0m Installing requirements..."
    pip install --upgrade pip
    pip install -r "$ROOT_DIR/backend/requirements.txt"
fi

# Function to clean up background processes on exit (Ctrl+C / SIGINT / SIGTERM)
cleanup() {
    echo -e "\n\033[1;31m[AI-Asset Router]\033[0m Shutting down backend and frontend processes..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Ensure ports 3000 and 8000 are clear from stale background servers
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
sleep 1

# Start Backend
echo -e "\033[1;32m[Backend]\033[0m Launching FastAPI server at http://localhost:8000..."
(
    cd "$ROOT_DIR/backend"
    source "$ROOT_DIR/backend/.venv/bin/activate"
    exec uvicorn app.main:app --reload --port 8000
) &
BACKEND_PID=$!

# Start Frontend
echo -e "\033[1;36m[Frontend]\033[0m Launching Next.js app at http://localhost:3000..."
(
    cd "$ROOT_DIR/frontend"
    rm -rf .next
    exec npm run dev
) &
FRONTEND_PID=$!

echo -e "\033[1;32m[AI-Asset Router]\033[0m Services are running!"
echo -e "  - Frontend: \033[4;36mhttp://localhost:3000\033[0m"
echo -e "  - Backend API: \033[4;32mhttp://localhost:8000\033[0m"
echo -e "  - Health Check: \033[4;32mhttp://localhost:8000/health\033[0m"
echo -e "Press \033[1mCtrl+C\033[0m to stop all services.\n"

# Wait for background processes to keep the script running
wait $BACKEND_PID $FRONTEND_PID
