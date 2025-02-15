import requests
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin
import time


class ContentParser:
    def __init__(self, base_url, delay=1):
        """
        Initialize parser with a base URL and optional delay between requests

        Args:
            base_url (str): The base URL of the permitted target site
            delay (int): Delay between requests in seconds
        """
        self.base_url = base_url
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": "SecurityResearchParser/1.0",
                "Accept": "application/json,*/*",
            }
        )

    def get_page_content(self, url):
        """Safely retrieve page content with rate limiting"""
        time.sleep(self.delay)
        try:
            response = self.session.get(url)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            print(f"Error fetching {url}: {e}")
            return None

    def find_json_content(self, html_content):
        """Extract JSON content from HTML including script tags"""
        json_data = []

        # Find inline JSON
        json_pattern = r"({[\s\S]*?})"
        potential_json = re.finditer(json_pattern, html_content)

        for match in potential_json:
            try:
                data = json.loads(match.group(1))
                json_data.append(data)
            except json.JSONDecodeError:
                continue

        # Parse script tags content
        soup = BeautifulSoup(html_content, "html.parser")
        scripts = soup.find_all("script")

        for script in scripts:
            if script.string:
                # Look for JSON object assignments
                json_vars = re.finditer(
                    r"(?:var|let|const)\s+(\w+)\s*=\s*({[\s\S]*?});", script.string
                )
                for match in json_vars:
                    try:
                        data = json.loads(match.group(2))
                        json_data.append({match.group(1): data})
                    except json.JSONDecodeError:
                        continue

        return json_data

    def find_js_endpoints(self, html_content):
        """Extract potential API endpoints and URLs from JavaScript code"""
        endpoints = set()

        # Find script tags
        soup = BeautifulSoup(html_content, "html.parser")
        scripts = soup.find_all("script")

        patterns = [
            r'(?:"|\')/api/[^"\'\s]+(?:"|\')',  # API endpoints
            r'(?:"|\')https?://[^"\'\s]+(?:"|\')',  # Full URLs
            r'(?:"|\')/[^\s"\']+\.js(?:"|\')',  # JavaScript files
            r'fetch\(["\']([^"\']+)["\']\)',  # Fetch requests
            r'axios\.[a-z]+\(["\']([^"\']+)["\']\)',  # Axios requests
        ]

        for script in scripts:
            if script.string:
                for pattern in patterns:
                    matches = re.finditer(pattern, script.string)
                    for match in matches:
                        url = (
                            match.group(1)
                            if "(" in pattern
                            else match.group(0).strip("'\"")
                        )
                        if url.startswith("/"):
                            url = urljoin(self.base_url, url)
                        endpoints.add(url)

        return list(endpoints)

    def analyze_page(self, url):
        """Analyze a single page for JSON and JavaScript content"""
        print(f"\nAnalyzing {url}")
        content = self.get_page_content(url)
        if not content:
            return None

        results = {
            "json_data": self.find_json_content(content),
            "js_endpoints": self.find_js_endpoints(content),
            "url": url,
        }

        return results

    def print_results(self, results):
        """Pretty print the analysis results"""
        if not results:
            return

        print(f"\nResults for {results['url']}")
        print("\nJSON Data Found:")
        for i, data in enumerate(results["json_data"], 1):
            print(f"\n{i}. {json.dumps(data, indent=2)[:200]}...")

        print("\nPotential JS Endpoints:")
        for endpoint in results["js_endpoints"]:
            print(f"- {endpoint}")
