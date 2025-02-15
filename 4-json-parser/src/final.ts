import fetch from "node-fetch";
import * as fs from "fs";
import * as readline from "readline";

enum JSMNType {
  UNDEFINED = "undefined",
  OBJECT = "object",
  ARRAY = "array",
  STRING = "string",
  PRIMITIVE = "primitive",
}

type JSMNToken = {
  type: JSMNType;
  start: number;
  end: number;
  size: number;
};

class JSMNParser {
  private pos: number = 0;
  private tokens: JSMNToken[] = [];

  parse(json: string): JSMNToken[] {
    this.pos = 0;
    this.tokens = [];
    this.tokenize(json);
    return this.tokens;
  }

  private tokenize(json: string): void {
    let i = 0;
    while (i < json.length) {
      const char = json[i];
      if (char === "{") {
        this.tokens.push({ type: JSMNType.OBJECT, start: i, end: -1, size: 0 });
      } else if (char === "[") {
        this.tokens.push({ type: JSMNType.ARRAY, start: i, end: -1, size: 0 });
      } else if (char === '"' || /[0-9tfn-]/.test(char)) {
        const token = this.readValue(json, i);
        this.tokens.push(token);
        i = token.end - 1;
      }
      i++;
    }
  }

  private readValue(json: string, start: number): JSMNToken {
    if (json[start] === '"') {
      let end = start + 1;
      while (end < json.length && json[end] !== '"') {
        end++;
      }
      return { type: JSMNType.STRING, start, end: end + 1, size: 1 };
    } else {
      let end = start;
      while (end < json.length && /[0-9truefalsenull.-]/.test(json[end])) {
        end++;
      }
      return { type: JSMNType.PRIMITIVE, start, end, size: 1 };
    }
  }
}

async function fetchJson(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Fetched JSON:", data);

    // Convert JSON to string for parsing
    const jsonString = JSON.stringify(data);

    // Parse JSON with JSMNParser
    const parser = new JSMNParser();
    const tokens = parser.parse(jsonString);
    console.log("Parsed JSON Tokens:", tokens);

    // Save to output file
    fs.writeFileSync("output.json", JSON.stringify(tokens, null, 2));
    console.log("Tokens saved to output.json");
  } catch (error) {
    console.error("Error fetching JSON:", error);
  }
}

// Function to ask user for URL
async function askForUrl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Enter the JSON URL: ", (url) => {
    fetchJson(url);
    rl.close();
  });
}

// Start
askForUrl();
