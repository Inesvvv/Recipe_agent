import http from "http";
import fs from "fs";
import path from "path";
import ollama from "ollama";

const MODEL = process.env.OLLAMA_MODEL || "llama3.2";

const SYSTEM_PROMPT = `You are a creative and practical chef assistant.
When given a list of ingredients, suggest 3 recipes the user can make.

For each recipe provide:
- Recipe name
- Which of the provided ingredients it uses
- Any common pantry staples needed (salt, oil, etc.)
- Brief cooking instructions (3-5 steps)

Keep suggestions realistic based on the ingredients given.
Prioritize recipes that use most of the provided ingredients.`;

async function getRecipeSuggestions(ingredients: string[]): Promise<string> {
  const ingredientList = ingredients.join(", ");

  const response = await ollama.chat({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `I have these ingredients in my fridge: ${ingredientList}. What recipes can I make?`,
      },
    ],
  });

  return response.message.content;
}

function parseBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendJSON(
  res: http.ServerResponse,
  status: number,
  data: unknown
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

const PUBLIC_DIR = path.join(__dirname, "..", "public");

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    const html = fs.readFileSync(path.join(PUBLIC_DIR, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  if (req.method === "POST" && req.url === "/recipes") {
    try {
      const body = await parseBody(req);

      if (
        typeof body !== "object" ||
        body === null ||
        !("ingredients" in body) ||
        !Array.isArray((body as { ingredients: unknown }).ingredients) ||
        (body as { ingredients: unknown[] }).ingredients.length === 0
      ) {
        sendJSON(res, 400, {
          error: 'Please provide an "ingredients" array with at least one item.',
        });
        return;
      }

      const ingredients = (
        body as { ingredients: unknown[] }
      ).ingredients.filter((i): i is string => typeof i === "string");

      if (ingredients.length === 0) {
        sendJSON(res, 400, { error: "Ingredients must be strings." });
        return;
      }

      console.log(`Getting recipes for: ${ingredients.join(", ")}`);
      const recipes = await getRecipeSuggestions(ingredients);
      sendJSON(res, 200, { ingredients, recipes });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error:", message);
      sendJSON(res, 500, { error: message });
    }
    return;
  }

  sendJSON(res, 404, { error: "Not found" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Recipe agent running at http://localhost:${PORT}`);
  console.log(`Using Ollama model: ${MODEL}`);
  console.log(`Try: curl -X POST http://localhost:${PORT}/recipes \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"ingredients": ["eggs", "cheese", "spinach", "garlic"]}'`);
});
