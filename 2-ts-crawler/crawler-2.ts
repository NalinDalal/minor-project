import axios, { AxiosInstance } from "axios";
import * as cheerio from "cheerio";

interface ParserConfig {
  baseUrl: string;
  delay?: number;
}

interface ParsedResults {
  jsonData: any[];
  jsEndpoints: string[];
  url: string;
}

export class ContentParser {
  private baseUrl: string;
  private delay: number;
  private client: AxiosInstance;

  constructor(config: ParserConfig) {
    this.baseUrl = config.baseUrl;
    this.delay = config.delay || 1000; // Default 1 second delay
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "User-Agent": "SecurityResearchParser/1.0",
        Accept: "application/json,*/*",
      },
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async getPageContent(url: string): Promise<string | null> {
    await this.sleep(this.delay);
    try {
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error fetching ${url}: ${error.message}`);
      }
      return null;
    }
  }

  private findJsonContent(htmlContent: string): any[] {
    const jsonData: any[] = [];

    // Find inline JSON
    const jsonPattern = /({[\s\S]*?})/g;
    const potentialJson = htmlContent.matchAll(jsonPattern);

    for (const match of potentialJson) {
      try {
        const data = JSON.parse(match[1]);
        jsonData.push(data);
      } catch {
        continue;
      }
    }

    // Parse script tags content
    const $ = cheerio.load(htmlContent);
    $("script").each((_, element) => {
      const scriptContent = $(element).html();
      if (scriptContent) {
        // Look for JSON object assignments
        const jsonVarPattern = /(?:var|let|const)\s+(\w+)\s*=\s*({[\s\S]*?});/g;
        const jsonVars = scriptContent.matchAll(jsonVarPattern);

        for (const match of jsonVars) {
          try {
            const data = JSON.parse(match[2]);
            jsonData.push({ [match[1]]: data });
          } catch {
            continue;
          }
        }
      }
    });

    return jsonData;
  }

  private findJsEndpoints(htmlContent: string): string[] {
    const endpoints = new Set<string>();
    const $ = cheerio.load(htmlContent);

    const patterns = [
      /(?:"|')\/?api\/[^"'\s]+(?:"|')/g, // API endpoints
      /(?:"|\')https?:\/\/[^"'\s]+(?:"|')/g, // Full URLs
      /(?:"|\')\/[^\s"']+\.js(?:"|')/g, // JavaScript files
      /fetch\(['"](.*?)['"]\)/g, // Fetch requests
      /axios\.[a-z]+\(['"](.*?)['"]\)/g, // Axios requests
    ];

    $("script").each((_, element) => {
      const scriptContent = $(element).html();
      if (scriptContent) {
        patterns.forEach((pattern) => {
          const matches = scriptContent.matchAll(pattern);
          for (const match of matches) {
            let url = pattern.toString().includes("(")
              ? match[1]
              : match[0].replace(/['"]/g, "");

            if (url.startsWith("/")) {
              url = new URL(url, this.baseUrl).toString();
            }
            endpoints.add(url);
          }
        });
      }
    });

    return Array.from(endpoints);
  }

  public async analyzePage(url: string): Promise<ParsedResults | null> {
    console.log(`\nAnalyzing ${url}`);
    const content = await this.getPageContent(url);

    if (!content) {
      return null;
    }

    return {
      jsonData: this.findJsonContent(content),
      jsEndpoints: this.findJsEndpoints(content),
      url,
    };
  }

  public printResults(results: ParsedResults | null): void {
    if (!results) {
      console.log("No results available");
      return;
    }

    console.log(`\nResults for ${results.url}`);

    console.log("\nJSON Data Found:");
    results.jsonData.forEach((data, index) => {
      console.log(
        `\n${index + 1}. ${JSON.stringify(data, null, 2).slice(0, 200)}...`,
      );
    });

    console.log("\nPotential JS Endpoints:");
    results.jsEndpoints.forEach((endpoint) => {
      console.log(`- ${endpoint}`);
    });
  }
}
