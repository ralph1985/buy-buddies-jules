from playwright.sync_api import sync_playwright, expect

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:5173/")

    # Wait for the H1 element to be visible
    h1 = page.locator("h1")
    expect(h1).to_be_visible(timeout=10000)

    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()
