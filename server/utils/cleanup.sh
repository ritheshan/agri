#!/bin/bash

echo "🧹 Starting project cleanup and organization..."

# Define base directory
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CLIENT_DIR="$BASE_DIR/client"
SERVER_DIR="$BASE_DIR/server"

# Make sure client and server directories exist
mkdir -p "$CLIENT_DIR"
mkdir -p "$SERVER_DIR"

# Clean console.log statements from JavaScript/React files
echo "🔍 Cleaning console.log statements from JavaScript/React files..."
find "$CLIENT_DIR/src" -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' '/console\.log(/d' {} \;

# Clean print statements from Python files (except critical ones)
echo "🔍 Cleaning print statements from Python files..."
find "$SERVER_DIR" -type f -name "*.py" -exec sed -i '' '/^\s*print(/d' {} \;

# Clean commented code blocks
echo "🔍 Cleaning commented code blocks..."
find "$CLIENT_DIR/src" -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' '/\/\/ Commented out code/,/\/\/ End commented code/d' {} \;
find "$CLIENT_DIR/src" -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' '/\/\/TODO:/d' {} \;
find "$CLIENT_DIR/src" -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' '/\/\*.*\*\//d' {} \;

# Move stray files into client or server
echo "📦 Organizing project structure..."

# Move Python files to server directory
echo "Moving Python files to server directory..."
for pyfile in "$BASE_DIR"/*.py; do
  if [ -f "$pyfile" ] && [ "$(basename "$pyfile")" != "__init__.py" ]; then
    cp "$pyfile" "$SERVER_DIR/"
    echo "Moved $(basename "$pyfile") to server directory"
    rm "$pyfile"
  fi
done

# Move model files to server directory
for modelfile in "$BASE_DIR"/*.h5 "$BASE_DIR"/*.pkl "$BASE_DIR"/*.json; do
  if [ -f "$modelfile" ]; then
    cp "$modelfile" "$SERVER_DIR/"
    echo "Moved $(basename "$modelfile") to server directory"
    rm "$modelfile"
  fi
done

# Move .env files to appropriate locations
if [ -f "$BASE_DIR/.env" ]; then
  cp "$BASE_DIR/.env" "$SERVER_DIR/.env"
  echo "Moved .env to server directory"
fi

# Make sure Vercel configuration exists
if [ ! -f "$CLIENT_DIR/vercel.json" ]; then
  echo "Creating Vercel configuration..."
  cat > "$CLIENT_DIR/vercel.json" << EOF
{
  "version": 2,
  "routes": [
    { "handle": "filesystem" },
    { "src": "/static/(.*)", "dest": "/static/\$1" },
    { "src": "/favicon.ico", "dest": "/favicon.ico" },
    { "src": "/manifest.json", "dest": "/manifest.json" },
    { "src": "/asset-manifest.json", "dest": "/asset-manifest.json" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "github": {
    "silent": true,
    "autoAlias": true
  },
  "env": {
    "VITE_API_URL": "https://agrimaster-api.onrender.com"
  }
}
EOF
  echo "Created vercel.json"
fi

# Make sure Render Procfile exists
if [ ! -f "$SERVER_DIR/Procfile" ]; then
  echo "Creating Render Procfile..."
  cat > "$SERVER_DIR/Procfile" << EOF
web: uvicorn main_fastapi:app --host 0.0.0.0 --port \$PORT
EOF
  echo "Created Procfile"
fi

# Move key documents to project root
if [ -f "$BASE_DIR/deployment-readme.md" ]; then
  mv "$BASE_DIR/deployment-readme.md" "$BASE_DIR/README.md"
  echo "Renamed deployment-readme.md to README.md"
fi

# If there's no README.md, create one
if [ ! -f "$BASE_DIR/README.md" ]; then
  echo "Creating README.md..."
  cat > "$BASE_DIR/README.md" << EOF
# AgriMaster Smart Agriculture Platform

A comprehensive agriculture management platform with features for crop recommendations, disease detection, weather forecasting, and more.

## Project Structure

- \`/client\`: Frontend React application (deploy to Vercel)
- \`/server\`: Backend FastAPI application (deploy to Render)

## Deployment Instructions

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set the root directory to \`client\`
3. Set environment variables:
   - VITE_API_URL=https://your-backend-url.onrender.com
   - VITE_GROQ_API_KEY=your-groq-api-key

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the root directory to \`server\`
4. Set the build command: \`pip install -r requirements.txt\`
5. Set the start command: \`uvicorn main_fastapi:app --host 0.0.0.0 --port \$PORT\`
6. Set environment variables from \`.env.example\`

## Development

To run locally:

1. Start the backend: \`cd server && uvicorn main_fastapi:app --reload\`
2. Start the frontend: \`cd client && npm run dev\`
EOF
  echo "Created README.md"
fi

# Create a comprehensive .gitignore
echo "Updating .gitignore..."
cat > "$BASE_DIR/.gitignore" << EOF
# Dependencies
node_modules
.pnp
.pnp.js
venv/
__pycache__/
*.py[cod]
*$py.class

# Build outputs
/dist/
/build/
/client/dist/
/client/build/

# Testing
/coverage/
.nyc_output
.pytest_cache/
htmlcov/

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor directories and files
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
.DS_Store

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
!.env.example

# Uploaded files
uploads/*
!uploads/.gitkeep

# Cached files
.cache/
.eslintcache
EOF
echo "Updated .gitignore"

# Create uploads directory with .gitkeep
mkdir -p "$BASE_DIR/uploads"
touch "$BASE_DIR/uploads/.gitkeep"

# Create scripts to start the application
echo "Creating start scripts..."
cat > "$BASE_DIR/start_frontend.sh" << EOF
#!/bin/bash
cd client && npm run dev
EOF
chmod +x "$BASE_DIR/start_frontend.sh"

cat > "$BASE_DIR/start_backend.sh" << EOF
#!/bin/bash
cd server && uvicorn main_fastapi:app --reload
EOF
chmod +x "$BASE_DIR/start_backend.sh"

# Clean any build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf "$CLIENT_DIR/dist" "$CLIENT_DIR/build" "$CLIENT_DIR/.cache"

echo "✅ Cleanup completed!"
echo "📋 Next steps:"
echo "  1. Deploy client folder to Vercel"
echo "  2. Deploy server folder to Render"
echo "  3. Ensure environment variables are set in both platforms"
