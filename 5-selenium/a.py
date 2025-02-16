from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.chrome.options import Options
import json
import os
import time

# Configure Selenium to capture network logs
chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--remote-debugging-port=9222")
chrome_options.set_capability("goog:loggingPrefs", {"performance": "ALL"})

# Start the WebDriver
service = Service("/path/to/chromedriver")  # Change this to your ChromeDriver path
driver = webdriver.Chrome(service=service, options=chrome_options)


def get_network_logs(url):
    driver.get(url)
    time.sleep(5)  # Allow some time for network requests

    logs = driver.get_log("performance")
    network_data = []

    for log in logs:
        log_json = json.loads(log["message"])
        message = log_json["message"]["params"]

        # Extract request & response data
        if "request" in message:
            request = message["request"]
            response = message.get("response", {})

            entry = {
                "url": request.get("url"),
                "method": request.get("method"),
                "headers": request.get("headers"),
                "response_status": response.get("status"),
                "response_headers": response.get("headers"),
            }
            network_data.append(entry)

    return network_data


def save_data(url):
    network_logs = get_network_logs(url)
    output_file = "network_logs.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(network_logs, f, indent=4)

    print(f"Network logs saved to {output_file}")


if __name__ == "__main__":
    user_url = input("Enter the URL to crawl: ")
    save_data(user_url)
    driver.quit()
