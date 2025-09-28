from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Set a desktop viewport size
        page.set_viewport_size({"width": 1280, "height": 800})

        # Navigate to the app
        page.goto("http://localhost:5173/")

        # Wait for the main layout to be visible
        # We can wait for a specific element that indicates the page has loaded
        expect(page.locator(".desktop-layout-container")).to_be_visible(timeout=10000)

        # Also wait for a key part of the shopping list to be visible
        expect(page.get_by_text("Ver Resumen Completo")).to_be_visible()

        # Take a screenshot
        screenshot_path = "jules-scratch/verification/desktop_layout.png"
        page.screenshot(path=screenshot_path)

        browser.close()
        print(f"Screenshot saved to {screenshot_path}")

if __name__ == "__main__":
    run_verification()