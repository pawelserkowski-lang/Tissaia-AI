from playwright.sync_api import sync_playwright

def verify_startup():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app running on localhost:5173
            response = page.goto("http://localhost:5173/")

            # Wait for the app to load (e.g., look for the root element or title)
            page.wait_for_selector("#root", state="attached")

            # Additional check: see if the title is correct
            title = page.title()
            print(f"Page title: {title}")

            # Take a screenshot
            page.screenshot(path="verification/startup_success.png")
            print("Screenshot saved to verification/startup_success.png")

        except Exception as e:
            print(f"Error during verification: {e}")
            # Take screenshot even on error if possible
            try:
                page.screenshot(path="verification/startup_error.png")
            except:
                pass
        finally:
            browser.close()

if __name__ == "__main__":
    verify_startup()
