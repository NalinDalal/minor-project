import * as readline from "readline";
import * as fs from "fs";
import * as Tesseract from "tesseract.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function performOCR(imagePath: string) {
  console.log(`Processing image: ${imagePath}...`);
  Tesseract.recognize(imagePath, "eng")
    .then(({ data: { text } }) => {
      console.log("Extracted Text:", text);
      fs.writeFileSync("output.txt", text, "utf-8");
      console.log("Saved to output.txt");
      rl.close();
    })
    .catch((err) => {
      console.error("OCR Error:", err);
      rl.close();
    });
}

rl.question("Enter the image path: ", (imagePath) => {
  performOCR(imagePath);
});
