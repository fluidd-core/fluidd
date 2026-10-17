"""Local fixture-only browser review; never connects to a service."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto((root / "admin-portal.html").as_uri())
    dark = page.locator('body').evaluate('(e)=>getComputedStyle(e).backgroundColor')
    page.get_by_role('button', name='Switch theme').click()
    assert page.locator('body').evaluate('(e)=>getComputedStyle(e).backgroundColor') != dark
    page.get_by_role('button', name='Switch theme').click()
    for screen in ["queue", "case", "accounts", "reservations", "audit"]:
        page.locator(f'nav [data-screen="{screen}"]').click()
        assert page.locator(f"#{screen}").is_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.screenshot(path=str(root / f"admin-{screen}.png"), full_page=True)
    page.locator('nav [data-screen="accounts"]').click()
    assert page.get_by_text("Keep account", exact=True).is_visible()
    assert page.get_by_text("Delete now", exact=True).count() == 0
    page.get_by_role("button", name="Suspend account", exact=True).click()
    assert page.locator("dialog").is_visible()
    page.get_by_role("button", name="Cancel", exact=True).click()
    assert not page.locator("dialog").is_visible()
    page.get_by_role("button", name="Confirm with passkey", exact=True).click()
    page.get_by_role("button", name="Preview passkey confirmation").click()
    assert "No action was saved" in page.locator("#status").inner_text()
    page.set_viewport_size({"width": 390, "height": 844})
    for theme in ['dark', 'light']:
      page.evaluate('(theme)=>document.documentElement.dataset.theme=theme', theme)
      for screen in ["queue", "case", "accounts", "reservations", "audit"]:
        page.locator(f'nav [data-screen="{screen}"]').click()
        overflow = page.locator('main').evaluate('(b)=>[...b.querySelectorAll("*")].filter(e=>e.getBoundingClientRect().right>innerWidth && getComputedStyle(e).position!=="absolute").map(e=>[e.tagName,e.className,e.textContent.slice(0,60)])')
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (theme, screen, overflow)
        page.screenshot(path=str(root / f'admin-{theme}-{screen}-phone.png'), full_page=True)
    page.locator('nav [data-screen="queue"]').click()
    page.screenshot(path=str(root / "admin-mobile.png"), full_page=True)
    assert not errors, errors
    browser.close()
print("PASS: five desktop/mobile screens, no overflow, dialog/cancel, fixture-only action, no JS errors")
