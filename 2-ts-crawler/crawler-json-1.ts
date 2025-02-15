// Create a bot in typescript which logs into a given website and fetchs the json content, along with other things and saves them
// saves all data, images, json files, xml to folder named crawled-data
//instead do it like it ask for site to test then it's suppossed creds etc then does the work
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import inquirer from "inquirer";

async function saveFile(
  url: string,
  outputDir: string,
  cookies: string,
): Promise<void> {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: { Cookie: cookies },
    });

    const contentType = response.headers["content-type"];
    const extension =
      contentType?.split("/")[1] || path.extname(url).split(".").pop();
    const fileName = path.basename(url).split("?")[0];
    const filePath = path.join(outputDir, `${fileName}.${extension}`);

    await fs.writeFile(filePath, response.data);
    console.log(`Saved: ${filePath}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to save file from ${url}:`, error.message);
    } else {
      console.error(`Failed to save file from ${url}: Unknown error`);
    }
  }
}

async function scrapeWebsite(
  loginUrl: string,
  username: string,
  password: string,
  jsonEndpoint: string,
  resources: string[],
  outputDir: string,
): Promise<void> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await fs.mkdir(outputDir, { recursive: true });

    await page.goto(loginUrl, { waitUntil: "networkidle2" });

    await page.type("input[type='text'], input[name='username']", username);
    await page.type("input[type='password'], input[name='password']", password);
    await page.click("button[type='submit'], input[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log("Login successful.");

    const cookies = await page.cookies();
    const cookieString = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const jsonResponse = await axios.get(jsonEndpoint, {
      headers: { Cookie: cookieString },
    });
    const jsonPath = path.join(outputDir, "data.json");
    await fs.writeFile(jsonPath, JSON.stringify(jsonResponse.data, null, 2));
    console.log(`Saved JSON data: ${jsonPath}`);

    for (const resource of resources) {
      await saveFile(resource, outputDir, cookieString);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error occurred:", error.message);
    } else {
      console.error("Error occurred: Unknown error");
    }
  } finally {
    await browser.close();
  }
}

(async () => {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "loginUrl",
      message: "Enter the login URL:",
      validate: (input) =>
        input.startsWith("http") ? true : "Enter a valid URL.",
    },
    {
      type: "input",
      name: "username",
      message: "Enter your username:",
    },
    {
      type: "password",
      name: "password",
      message: "Enter your password:",
      mask: "*",
    },
    {
      type: "input",
      name: "jsonEndpoint",
      message: "Enter the JSON API endpoint (leave blank if none):",
      default: "",
    },
    {
      type: "input",
      name: "resources",
      message: "Enter the resource URLs (comma-separated):",
      filter: (input: string) =>
        input.split(",").map((url: string) => url.trim()),
    },
    {
      type: "input",
      name: "outputDir",
      message: "Enter the output directory:",
      default: "crawled-data",
    },
  ]);

  await scrapeWebsite(
    answers.loginUrl,
    answers.username,
    answers.password,
    answers.jsonEndpoint || "",
    answers.resources,
    path.resolve(answers.outputDir),
  );
})();
