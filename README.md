# 🍳 Recipe Agent

A local AI-powered recipe suggester. Give it ingredients from your fridge and it returns 3 recipe ideas — no API key needed, runs entirely on your machine using Ollama.

## Prerequisites

- [Node.js](https://nodejs.org) (v18+)
- [Ollama](https://ollama.com) installed and a model pulled

## Setup

```bash
# 1. Install Ollama (macOS)
brew install ollama

# 2. Pull a model
ollama pull llama3.2

# 3. Install dependencies
cd Recipe_agent
npm install
```

## Running

You need two terminals:

**Terminal 1 — start the recipe server:**
```bash
npm start
```

**Terminal 2 — open in browser:**
```
http://localhost:3000
```

Ollama starts automatically in the background on most systems. If recipes hang, run `ollama serve` in a third terminal.

## Usage

1. Type an ingredient and press **Enter** to add it as a tag
2. Add as many ingredients as you like
3. Click **Get Recipe Ideas**
4. Wait ~10–30s for the first response (model loads into memory), faster after that

## Configuration

| Environment variable | Default    | Description                  |
|----------------------|------------|------------------------------|
| `OLLAMA_MODEL`       | `llama3.2` | Any model you've pulled      |
| `PORT`               | `3000`     | Port the server listens on   |

```bash
# Example: use a different model
OLLAMA_MODEL=mistral npm start
```

## Project Structure

```
recipe-agent/
├── src/
│   └── server.ts      # HTTP server + Ollama integration
├── public/
│   └── index.html     # Web UI
├── package.json
└── tsconfig.json
```

## API

The server also exposes a JSON endpoint if you prefer the terminal:

```bash
curl -X POST http://localhost:3000/recipes \
  -H "Content-Type: application/json" \
  -d '{"ingredients": ["eggs", "cheese", "spinach", "garlic"]}'
```
