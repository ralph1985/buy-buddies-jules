from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5173/")

        # Wait for the login modal to be visible
        expect(page.get_by_label("Nombre de miembro:")).to_be_visible()

        # Log in
        page.get_by_label("Nombre de miembro:").fill("Rafa")
        page.get_by_role("button", name="Entrar").click()

        # Wait for the shopping list to be visible, with a longer timeout
        expect(page.locator(".shopping-list")).to_be_visible(timeout=15000)

        # Click the "Filtros" button to open the side menu
        page.get_by_role("button", name="Filtros").click()

        # Wait for the menu to be fully open
        expect(page.locator(".filter-menu.is-open")).to_be_visible()

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/side_menu_open.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
