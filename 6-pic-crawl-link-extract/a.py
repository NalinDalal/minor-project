import os
import argparse
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse


def sanitize_filename(url):
    """Sanitize the filename by removing query parameters and special characters."""
    parsed_url = urlparse(url)
    filename = os.path.basename(parsed_url.path)
    return filename if filename else "image.jpg"


def fetch_html(url):
    """Fetch webpage HTML and return a BeautifulSoup object."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Raise an error for bad responses (4xx, 5xx)
        return BeautifulSoup(response.text, "html.parser")
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None


def extract_and_download_images(url, output_folder):
    """Extracts images from a webpage and downloads them."""
    print(f"📡 Fetching images from: {url}")

    # Create output folder if not exists
    os.makedirs(output_folder, exist_ok=True)

    # Fetch and parse HTML
    soup = fetch_html(url)
    if soup is None:
        return

    img_tags = soup.find_all("img")
    if not img_tags:
        print("❌ No images found on the page.")
        return

    downloaded = 0
    for img in img_tags:
        img_url = img.get("src")
        if not img_url:
            continue

        # Handle relative URLs
        img_url = urljoin(url, img_url)

        try:
            img_data = requests.get(img_url, timeout=10).content
            img_name = os.path.join(output_folder, sanitize_filename(img_url))

            with open(img_name, "wb") as f:
                f.write(img_data)
            print(f"✅ Downloaded: {img_name}")
            downloaded += 1

        except requests.RequestException as e:
            print(f"❌ Failed to download {img_url}: {e}")

    print(f"🎉 Downloaded {downloaded} images to '{output_folder}'")


def main():
    """Main function to ask the user for input and run the image downloader."""
    url = input("🔗 Enter the website URL: ").strip()
    output_folder = input(
        "📂 Enter output folder (default: 'downloaded_images'): "
    ).strip()

    if not output_folder:
        output_folder = "downloaded_images"

    extract_and_download_images(url, output_folder)


if __name__ == "__main__":
    main()
