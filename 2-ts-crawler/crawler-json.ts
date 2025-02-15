// Create a bot in typescript which logs into a given website and fetchs the json content, along with other things and saves them
// saves all data, images, json files, xml to folder named crawled-data
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import axios from "axios";

async function saveFile(
  url: string,
  outputDir: string,
  cookies: string,
): Promise<void> {
  try {
    // Fetch content from the URL
    const response = await axios.get(url, {
      responseType: "arraybuffer", // Handle binary data for images
      headers: { Cookie: cookies },
    });

    // Determine file type from headers or URL
    const contentType = response.headers["content-type"];
    const extension =
      contentType?.split("/")[1] || path.extname(url).split(".").pop();
    const fileName = path.basename(url).split("?")[0]; // Handle query strings in URLs

    // Save the file to the appropriate folder
    const filePath = path.join(outputDir, `${fileName}.${extension}`);
    await fs.writeFile(filePath, response.data);
    console.log(`Saved: ${filePath}`);
  } catch (error) {
    console.error(`Failed to save file from ${url}:`, error);
  }
}

async function scrapeWebsite(
  loginUrl: string,
  username: string,
  password: string,
  jsonEndpoint: string,
  resources: string[], // Array of resource URLs to download
  outputDir: string,
): Promise<void> {
  // Launch Puppeteer
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Navigate to login page
    await page.goto(loginUrl, { waitUntil: "networkidle2" });

    // Enter username and password
    await page.type("#username", username);
    await page.type("#password", password);

    // Click login button
    await page.click("#login-button");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log("Login successful.");

    // Extract cookies for authenticated session
    const cookies = await page.cookies();
    const cookieString = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    // Save JSON data
    const jsonResponse = await axios.get(jsonEndpoint, {
      headers: { Cookie: cookieString },
    });
    const jsonPath = path.join(outputDir, "data.json");
    await fs.writeFile(jsonPath, JSON.stringify(jsonResponse.data, null, 2));
    console.log(`Saved JSON data: ${jsonPath}`);

    // Download resources (images, XML, etc.)
    for (const resource of resources) {
      await saveFile(resource, outputDir, cookieString);
    }
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    // Close Puppeteer browser
    await browser.close();
  }
}

// Example Usage
(async () => {
  const loginUrl = "https://example.com/login"; // Replace with login page URL
  const username = "your_username"; // Replace with your username
  const password = "your_password"; // Replace with your password
  const jsonEndpoint = "https://example.com/api/data"; // Replace with API endpoint for JSON data
  const resources = [
    "https://example.com/image1.jpg",
    "https://example.com/file.xml",
  ]; // List of resources to download (images, XML, etc.)
  const outputDir = path.resolve("crawled-data"); // Save all files here

  await scrapeWebsite(
    loginUrl,
    username,
    password,
    jsonEndpoint,
    resources,
    outputDir,
  );
})();
