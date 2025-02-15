import * as readline from "readline";
import * as fs from "fs";
import * as Tesseract from "tesseract.js";
import axios from "axios";
import * as path from "path";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function downloadImage(url: string, outputPath: string): Promise<string> {
  try {
    const response = await axios({
      url,
      responseType: "arraybuffer",
    });

    fs.writeFileSync(outputPath, response.data);
    console.log(`Image downloaded: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
}

async function performOCR(imagePath: string) {
  console.log(`Processing image: ${imagePath}...`);
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(imagePath, "eng");
    console.log("Extracted Text:", text);
    fs.writeFileSync("output.txt", text, "utf-8");
    console.log("Saved to output.txt");
  } catch (err) {
    console.error("OCR Error:", err);
  } finally {
    rl.close();
  }
}

rl.question("Enter the image path (local or URL): ", async (inputPath) => {
  if (inputPath.startsWith("http")) {
    const tempImagePath = path.join(__dirname, "temp_image.jpg");
    try {
      const downloadedPath = await downloadImage(inputPath, tempImagePath);
      await performOCR(downloadedPath);
      fs.unlinkSync(tempImagePath); // Cleanup temp file
    } catch (error) {
      console.error("Failed to process the image.");
    }
  } else {
    await performOCR(inputPath);
  }
});
