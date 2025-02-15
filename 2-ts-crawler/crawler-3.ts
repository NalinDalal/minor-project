import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs-extra";
import path from "path";
import readline from "readline";

// Utility to ask for user input
const askQuestion = (query: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    }),
  );
};

const downloadFile = async (url: string, outputPath: string): Promise<void> => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    await fs.outputFile(outputPath, response.data);
    console.log(`Downloaded: ${url} -> ${outputPath}`);
  } catch (error: any) {
    console.error(`Error downloading ${url}:`, error.message);
  }
};

const crawlPage = async (url: string, outputDir: string): Promise<void> => {
  try {
    // Fetch the main HTML
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    // Save the main HTML
    const htmlPath = path.join(outputDir, "index.html");
    await fs.outputFile(htmlPath, html);
    console.log(`Saved HTML to ${htmlPath}`);

    // Process <script> and <link> tags
    const resourceUrls: string[] = [];
    $('script[src], link[rel="stylesheet"]').each((_, elem) => {
      const src = $(elem).attr("src") || $(elem).attr("href");
      if (src) {
        const absoluteUrl = new URL(src, url).href;
        resourceUrls.push(absoluteUrl);
      }
    });

    // Download resources
    for (const resourceUrl of resourceUrls) {
      const fileName = path.basename(new URL(resourceUrl).pathname);
      const filePath = path.join(outputDir, fileName);
      await downloadFile(resourceUrl, filePath);
    }

    console.log(`Crawled and saved resources for ${url}`);
  } catch (error: any) {
    console.error(`Error crawling ${url}:`, error.message);
  }
};

const main = async () => {
  const targetUrl = await askQuestion("Enter the URL to crawl: ");
  const folderName = await askQuestion("Enter the folder name to save files: ");
  const outputDir = path.resolve(__dirname, folderName);

  console.log(`Starting crawl for ${targetUrl}`);
  await crawlPage(targetUrl, outputDir);
  console.log(`Crawl completed for ${targetUrl}`);
};

main().catch(console.error);
