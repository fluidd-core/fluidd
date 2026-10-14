"""Browser regressions against a built Fluidd and a mocked console.

Run: python tools/test_account_followups.py --dist dist
Only the loopback static server is allowed through; every API and printer read
is intercepted. No account, printer, credential, deployment or public service
is used. Requires the existing Python Playwright installation and Chromium.
"""
import argparse
import functools
import json
import pathlib
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright


class StaticHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if not pathlib.Path(self.translate_path(self.path)).is_file():
            self.path = "/index.html"
        super().do_GET()

    def log_message(self, *_args):
        pass


def console_fixture(pending=False, refused=False):
    return {
        "pending": pending, "refused": refused, "requests": [], "recent": False, "approvals": [],
        "passkey": {"id": "key1", "name": "Sample passkey", "created_at": 1790000000, "last_used_at": None},
        "account": {
            "id": "sample-account", "name": "Sample Person",
            "email": "sample@example.test", "created_at": 1790000000,
            "email_verified": True, "has_password": True, "two_step": True,
            "name_source": "person", "deletion": None,
        },
        "share": {"id": "share1", "printer_id": "p1", "email": "friend@example.test",
                  "role": "operator", "ends_at": 1900000000, "created_at": 1790000000},
        "invite": {"id": "invite1", "printer_id": "p1", "email": "guest@example.test",
                   "role": "viewer", "ends_at": 1900000000, "created_at": 1790000000},
    }


def install_routes(page, origin, fixture, signed_in=True):
    page.add_init_script("""({origin, signedIn}) => {
      localStorage.setItem('muon.cloud.url', origin);
      if (!sessionStorage.getItem('mock.seeded')) {
        sessionStorage.setItem('mock.seeded', '1');
        if (signedIn) localStorage.setItem('muon.cloud.token', 'mock-session');
      }
      sessionStorage.setItem('muon.cloud.silent', '1');
      window.__copied = null;
      Object.defineProperty(navigator, 'clipboard', {value: {
        writeText: async value => { window.__copied = value; }
      }});
    }""".replace("({origin, signedIn}) =>", "(() =>").replace(
        "localStorage.setItem('muon.cloud.url', origin);",
        f"const origin = {json.dumps(origin)}, signedIn = {str(signed_in).lower()}; "
        "localStorage.setItem('muon.cloud.url', origin);"
    ) + ")()")

    def reply(route, status=200, **body):
        route.fulfill(status=status, content_type="application/json", body=json.dumps(body),
                      headers={"Access-Control-Allow-Origin": "*"})

    def handle(route):
        request = route.request
        url = urlparse(request.url)
        path = url.path
        method = request.method
        if path == '/config.json':
            reply(route, hosted=True, blacklist=['127.0.0.1'], endpoints=[])
            return
        if method == "OPTIONS":
            route.fulfill(status=204, headers={"Access-Control-Allow-Origin": "*",
                                             "Access-Control-Allow-Headers": "authorization,content-type",
                                             "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS"})
            return
        body = request.post_data_json if request.post_data and request.headers.get("content-type", "").startswith("application/json") else {}
        if path.startswith("/v1/"):
            fixture["requests"].append((method, path, body))
            if path == "/v1/config":
                reply(route, relay_url="https://relay.example.test", orchestrator_id="mock", authority_key="mock", social={"apple": False, "google": False})
            elif path == "/v1/me" and method == "GET":
                account = dict(fixture["account"])
                account["deletion"] = {"requested_at": 1792281600, "delete_after": 1793491200} if fixture["pending"] else None
                reply(route, account=account, endpoint_id=None, session_id="session1",
                      sign_in={"password": account["has_password"], "passkeys": 1, "identities": [], "two_step": account["two_step"]},
                      two_step={"enabled": True, "recovery_left": 8, "recovery_generated_at": 1790000000}, email_pending=None)
            elif path == "/v1/me/deletion/cancel":
                fixture["pending"] = fixture["refused"] = False
                reply(route, ok=True, account={**fixture["account"], "deletion": None})
            elif path == "/v1/me" and method == "DELETE":
                if not fixture["recent"] and (body.get("password") != "mock password" or body.get("code") != "123456"):
                    reply(route, 403, reauth_required=True, error="enter your password to confirm it is you")
                else:
                    reply(route, ok=True, deleted=True, unlinked=1)
            elif path == "/v1/links/nearby":
                reply(route, printers=[{"printer_id": f"near{i}", "name": name, "model": "M1", "linked": False,
                                        "local_addrs": [f"127.0.0.1:{18760+i}"]}
                                       for i, name in enumerate(["Ready sample", "Printing sample", "Locked sample"], 1)])
            elif fixture["pending"] or fixture["refused"]:
                fixture["pending"] = True
                reply(route, 403, deletion_pending=True, delete_after=1793491200)
            elif path == "/v1/printers":
                reply(route, printers=[{"id": "p1", "name": "Sample M1", "model": "M1", "version": "mock",
                                        "online": False, "online_since": None, "last_seen": 1790000000,
                                        "linked_at": 1790000000, "role": "operator", "shared": False}])
            elif path.endswith("/shares"):
                if method == "POST":
                    fixture["share"].update(body)
                reply(route, shares=[fixture["share"]], share=fixture["share"])
            elif path.endswith("/invites"):
                reply(route, invites=[fixture["invite"]], invite=fixture["invite"])
            elif path.endswith("/links"):
                reply(route, links=[{"id": "link1", "printer_id": "p1", "role": "viewer", "approve_each": False,
                                     "max_uses": 5, "uses": 0, "expires_at": 1900000000, "created_at": 1790000000,
                                     "url": "https://console.example.test/j/0000000000"}])
            elif path == "/v1/fleet/layout":
                reply(route, layout={})
            elif path == "/v1/me/sessions":
                reply(route, sessions=[])
            elif path == "/v1/me/events":
                reply(route, events=[])
            elif path == "/v1/approvals":
                reply(route, approvals=[a for a in fixture["approvals"] if a["state"] == "pending"])
            elif path.startswith("/v1/approvals/") and method == "POST":
                approval = next(a for a in fixture["approvals"] if a["id"] == path.rsplit("/", 1)[-1])
                approval["state"] = "allowed" if body.get("allow") else "refused"
                reply(route, approval=approval)
            elif path == "/v1/me/passkeys":
                reply(route, passkeys=[fixture["passkey"]])
            elif path == "/v1/me/passkeys/key1" and method == "PATCH":
                if body.get("password") != "mock password" or body.get("code") != "123456":
                    reply(route, 403, reauth_required=True, error="enter your password to confirm it is you")
                else:
                    fixture["passkey"]["name"] = body["name"]
                    reply(route, id="key1", name=body["name"])
            elif path == "/v1/me/identities":
                reply(route, identities=[])
            else:
                reply(route, 404)
        elif path == "/printer/objects/query" and url.port in (18761, 18762, 18763):
            if url.port == 18763:
                reply(route, 401)
            else:
                reply(route, result={"status": {"webhooks": {"state": "ready"},
                                                "print_stats": {"state": "printing" if url.port == 18762 else "standby"}}})
        elif path == "/logout":
            route.fulfill(content_type="text/html", body='<script>location.replace("/signed-out")</script>')
        elif url.netloc == urlparse(origin).netloc and url.scheme == "http" and (path == "/config.json" or path.startswith(("/assets/", "/fonts/", "/img/")) or "." not in path.rsplit("/", 1)[-1] or path == "/index.html"):
            route.continue_()
        else:
            # Includes DNS guesses, discovery scans, model APIs and service workers.
            reply(route, 404)

    page.route("**/*", handle)
    page.route_web_socket("**/*", lambda socket: socket.close())


def run(browser, origin, output):
    def new_page(fixture, signed_in=True, width=1440):
        context = browser.new_context(viewport={"width": width, "height": 1000}, service_workers="block")
        page = context.new_page()
        install_routes(page, origin, fixture, signed_in)
        return context, page

    for width in (1440, 390):
        print(f"Checking deletion at {width}px", flush=True)
        fixture = console_fixture(pending=True)
        context, page = new_page(fixture, width=width)
        page.goto(origin + "/")
        banner = page.locator('[data-tid="deletion-banner"]')
        expect(banner).to_be_visible(timeout=60000)
        expect(banner).to_contain_text("1 Nov")
        expect(page.locator('[data-tid="printers-deletion"]')).to_be_visible()
        page.screenshot(path=str(output / f"deletion-{width}.png"), full_page=True)
        for route in ("/library", "/link", "/join?code=0000000000"):
            page.goto(origin + route)
            expect(page.locator('[data-tid="deletion-unavailable"]')).to_be_visible(timeout=60000)
            expect(page.locator('[role="alert"]')).to_have_count(0)
        page.locator('[data-tid="deletion-keep"]').click()
        expect(banner).to_have_count(0, timeout=60000)
        assert ("POST", "/v1/me/deletion/cancel", {}) in fixture["requests"]
        context.close()

    fixture = console_fixture(refused=True)
    context, page = new_page(fixture)
    page.goto(origin + "/library")
    expect(page.locator('[data-tid="deletion-banner"]')).to_be_visible(timeout=60000)
    expect(page.locator('[data-tid="deletion-unavailable"]')).to_be_visible()
    page.locator('[data-tid="deletion-now"]').click()
    page.locator('[data-tid="deletion-confirm"]').click()
    expect(page.locator('[data-tid="reauth-dialog"]')).to_be_visible()
    expect(page.locator('[data-tid="reauth-dialog"]')).to_contain_text("Passkey confirmation: Coming soon")
    page.locator('[data-tid="reauth-password"]').fill("mock password")
    page.locator('[data-tid="reauth-code"]').fill("123 456")
    page.locator('[data-tid="reauth-submit"]').click()
    expect(page.locator('[data-tid="signed-out-page"]')).to_be_visible(timeout=60000)
    assert ("DELETE", "/v1/me", {"password": "mock password", "code": "123456", "now": True}) in fixture["requests"]
    context.close()

    fixture = console_fixture()
    context, page = new_page(fixture)
    page.goto(origin + "/account/printers")
    people = page.locator('[data-tid="printers-person"]')
    expect(people).to_have_count(2, timeout=60000)
    people.first.locator('[data-tid="person-role"]').click()
    page.locator('[data-tid="role-viewer"]').click()
    page.locator('[data-tid="role-save"]').click()
    expect(page.get_by_text("friend@example.test can now watch Sample M1.", exact=True)).to_be_visible()
    page.locator('[data-tid="invite-resend"]').click()
    expect(page.get_by_text("Invitation sent to guest@example.test.", exact=True)).to_be_visible()
    page.get_by_role("button", name="Copy link", exact=True).click()
    assert page.evaluate("window.__copied") == "https://console.example.test/j/0000000000"
    assert ("POST", "/v1/printers/p1/shares", {"email": "friend@example.test", "role": "viewer", "ends_at": 1900000000}) in fixture["requests"]
    assert ("POST", "/v1/printers/p1/invites", {"email": "guest@example.test", "role": "viewer", "ends_at": 1900000000}) in fixture["requests"]
    expect(page.locator('[data-tid="account"] .muon-account__initials')).to_have_text("S")
    page.screenshot(path=str(output / "sharing.png"), full_page=True)
    page.goto(origin + "/account/security")
    key = page.locator('[data-tid="security-passkey"]')
    expect(key).to_be_visible(timeout=60000)
    key.get_by_role("button", name="Rename", exact=True).click()
    rename = page.get_by_role("dialog", name="Rename this passkey", exact=True)
    rename.get_by_role("textbox", name="Name", exact=True).fill("Renamed sample")
    rename.get_by_role("button", name="Rename", exact=True).click()
    expect(page.locator('[data-tid="reauth-dialog"]')).to_be_visible()
    page.locator('[data-tid="reauth-password"]').fill("mock password")
    page.locator('[data-tid="reauth-code"]').fill("123456")
    page.locator('[data-tid="reauth-submit"]').click()
    expect(key).to_contain_text("Renamed sample")
    assert ("PATCH", "/v1/me/passkeys/key1", {"name": "Renamed sample", "password": "mock password", "code": "123456"}) in fixture["requests"]
    context.close()

    fixture = console_fixture()
    fixture["recent"] = True
    fixture["account"].update(has_password=False, two_step=False)
    context, page = new_page(fixture)
    page.goto(origin + "/account/delete")
    page.locator('[data-tid="delete-open"]').click()
    page.locator('[data-tid="delete-now"]').click()
    page.locator('[data-tid="delete-continue"]').click()
    page.locator('[data-tid="delete-confirm"]').click()
    expect(page.locator('[data-tid="delete-done"]')).to_be_visible()
    assert ("DELETE", "/v1/me", {"now": True}) in fixture["requests"]
    context.close()

    fixture = console_fixture()
    fixture["approvals"] = [{"id": "approval1", "kind": "link_join", "printer_id": "p1", "printer_name": "Sample M1", "link_id": "link1", "role": "operator", "state": "pending", "requester": {"email": "waiting@example.test"}, "created_at": 1790000000, "expires_at": 1900000000}]
    context, page = new_page(fixture)
    page.goto(origin + "/account/printers")
    allow = page.locator('[data-tid="approval-allow"]')
    expect(allow).to_have_text("Allow Operator", timeout=60000)
    allow.click()
    expect(allow).to_have_count(0)
    assert ("POST", "/v1/approvals/approval1", {"allow": True}) in fixture["requests"]
    context.close()

    context, page = new_page(console_fixture(), signed_in=False)
    page.goto(origin + "/signed-out")
    statuses = page.locator('[data-tid="nearby-status"]')
    expect(statuses).to_have_text(["Ready", "Printing", "Needs access"], timeout=60000)
    expect(page.get_by_role("link", name="Open", exact=True)).to_have_count(3)
    page.screenshot(path=str(output / "signed-out.png"), full_page=True)
    context.close()
    print("Mocked-console browser checks passed: deletion, restore, delete now, fallback confirmation, avatar, sharing, resend, copy link and nearby state.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", type=pathlib.Path, default=pathlib.Path("dist"))
    parser.add_argument("--output", type=pathlib.Path, default=pathlib.Path("test-results/account-followups"))
    parser.add_argument("--channel", default="chrome", help="Installed Chromium browser channel (default: chrome)")
    args = parser.parse_args()
    if not (args.dist / "index.html").is_file():
        parser.error("Build Fluidd first (npm run build).")
    args.output.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(StaticHandler, directory=str(args.dist.resolve())))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as p:
            print(f"Launching headless {args.channel} against the loopback mock", flush=True)
            browser = p.chromium.launch(headless=True, channel=args.channel)
            try:
                run(browser, f"http://127.0.0.1:{server.server_port}", args.output)
            finally:
                browser.close()
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
