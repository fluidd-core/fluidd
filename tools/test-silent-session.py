"""Exercise the production session-check module in Chromium with a local OAuth fixture.

Run: python -I tools/test-silent-session.py
Requires Python Playwright with Chromium and the repository's Node dependencies.
Bundles only centralLogin.ts, never the application. No internet or printers.
Add --live-signed-out for one read-only check against the production console.
"""
import argparse
import base64
import hashlib
import json
import subprocess
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlsplit

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
HTML = b'''<p id="app">App shown</p><script src="/session.js"></script>
<script>window.done=false;
CentralLogin.checkCentralSession().then(() => { window.done=true });</script>'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live-signed-out", action="store_true")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="control-silent-") as scratch:
        bundle = Path(scratch) / "session.js"
        subprocess.run([
            "node", "-e",
            "require('esbuild').buildSync({entryPoints:['src/services/muon-cloud/centralLogin.ts'],"
            "bundle:true,format:'iife',globalName:'CentralLogin',"
            "define:{'import.meta.env.VUE_MUON_CLOUD_URL':'undefined'},outfile:process.argv[1]})",
            str(bundle),
        ], cwd=ROOT, check=True)
        script = bundle.read_bytes()
        state = {"scenario": "signed-out", "authorizations": 0, "exchanges": 0,
                 "foreign": 0, "challenge": None, "spent": False}
        gate = threading.Event()

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *_args):
                pass  # No request URLs, cookies, codes or tokens in logs.

            def send(self, status, body=b"", headers=()):
                self.send_response(status)
                for name, value in headers:
                    self.send_header(name, value)
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def do_GET(self):
                url = urlsplit(self.path)
                if url.path == "/session.js":
                    self.send(200, script, [("Content-Type", "text/javascript")])
                elif url.path == "/authorize":
                    state["authorizations"] += 1
                    query = parse_qs(url.query)
                    assert query["client_id"] == ["fluidd"]
                    assert query["redirect_uri"] == [origin + "/"]
                    assert query["code_challenge_method"] == ["S256"]
                    assert query["prompt"] == ["none"]
                    assert "Referer" not in self.headers
                    state["challenge"] = query["code_challenge"][0]
                    gate.wait(5)
                    cookie = "__Host-muon3d_session=fixture" in self.headers.get("Cookie", "")
                    reply = {"state": query["state"][0], "iss": origin}
                    if cookie:
                        reply["code"] = "fixture-code"
                    else:
                        reply["error"] = "login_required"
                    if state["scenario"] == "wrong-state":
                        reply["state"] = "forged"
                    if state["scenario"] == "wrong-issuer":
                        reply["iss"] = "https://evil.example"
                    destination = origin + "/?" + urlencode(reply)
                    if state["scenario"] == "foreign-redirect":
                        destination = origin.replace("localhost", "127.0.0.1") + "/foreign"
                    self.send(303, headers=[("Location", destination)])
                elif url.path == "/foreign":
                    state["foreign"] += 1
                    self.send(200)
                elif url.path == "/" and url.query:
                    # A followed redirect downloads inert HTML. Executing it
                    # would visibly replace the current document and fail.
                    self.send(200, b"<script>window.inertHtmlExecuted=true</script>",
                              [("Content-Type", "text/html")])
                else:
                    headers = [("Content-Type", "text/html")]
                    if state["scenario"] != "signed-out":
                        headers.append(("Set-Cookie", "__Host-muon3d_session=fixture; Path=/; Secure; HttpOnly; SameSite=Lax"))
                    self.send(200, HTML, headers)

            def do_POST(self):
                assert self.path == "/token"
                state["exchanges"] += 1
                query = parse_qs(self.rfile.read(int(self.headers["Content-Length"])).decode())
                challenge = base64.urlsafe_b64encode(hashlib.sha256(query["code_verifier"][0].encode()).digest()).decode().rstrip("=")
                valid = (challenge == state["challenge"] and not state["spent"]
                         and query["code"] == ["fixture-code"]
                         and query["client_id"] == ["fluidd"]
                         and query["redirect_uri"] == [origin + "/"])
                state["spent"] = True
                if not valid:
                    self.send(400, b'{"error":"invalid_grant"}')
                    return
                self.send(200, json.dumps({"access_token": "fixture-access", "refresh_token": "fixture-refresh",
                                          "token_type": "Bearer", "expires_in": 900}).encode(),
                          [("Content-Type", "application/json")])

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        origin = f"http://localhost:{server.server_port}"
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(headless=True)
                try:
                    for scenario in ["signed-out", "signed-in", "wrong-state", "wrong-issuer", "foreign-redirect"]:
                        state.update(scenario=scenario, authorizations=0, exchanges=0, foreign=0, spent=False)
                        gate.clear()
                        context = browser.new_context()
                        page = context.new_page()
                        navigations = []
                        failures = []
                        page.on("framenavigated", lambda frame: navigations.append(frame.url))
                        page.on("requestfailed", lambda request: failures.append(request.failure))
                        page.goto(origin + "/fleet?sort=name#card", wait_until="domcontentloaded")
                        assert page.locator("#app").inner_text() == "App shown"
                        assert not page.evaluate("window.done"), "App must show before the check answers"
                        gate.set()
                        page.wait_for_function("window.done")
                        if scenario == "foreign-redirect":
                            # Chromium's blocked redirect need not emit networkidle.
                            # The completed check and failed request are the barrier.
                            assert failures, "Browser must reject the cross-origin fetch"
                        else:
                            page.wait_for_load_state("networkidle")
                        assert page.url == origin + "/fleet?sort=name#card"
                        assert len(navigations) == 1, "No document may be discarded"
                        assert not page.evaluate("!!window.inertHtmlExecuted")
                        assert page.evaluate("document.cookie") == "", "Session cookie must remain HttpOnly"
                        signed_in = scenario == "signed-in"
                        assert page.evaluate("localStorage.getItem('muon.cloud.token') === 'fixture-access'") == signed_in
                        assert page.evaluate("localStorage.getItem('muon.cloud.refresh') === 'fixture-refresh'") == signed_in
                        assert state["authorizations"] == 1
                        assert state["exchanges"] == int(signed_in)
                        assert state["foreign"] == 0, "Same-origin mode must stop the foreign redirect"
                        page.evaluate("CentralLogin.checkCentralSession()")
                        assert state["authorizations"] == 1, "Only one attempt per tab"
                        context.close()
                        print(f"PASS {scenario}: one document; app shown before check; no foreign request")
                    if args.live_signed_out:
                        context = browser.new_context()  # No saved cookies or credentials.
                        page = context.new_page()
                        navigations, answers = [], []
                        page.on("framenavigated", lambda frame: navigations.append(frame.url))
                        page.on("response", lambda response: answers.append(response)
                                if urlsplit(response.url).path == "/authorize" else None)

                        def live_route(route):
                            url = urlsplit(route.request.url)
                            if url.netloc != "app.muon3d.com":
                                route.abort()
                            elif url.path == "/authorize" and route.request.resource_type == "fetch":
                                route.continue_()  # The only real production request.
                            elif url.path == "/session.js":
                                route.fulfill(body=script, content_type="text/javascript")
                            elif url.path == "/fleet":
                                route.fulfill(body=HTML, content_type="text/html")
                            elif url.path == "/" and "error=login_required" in url.query:
                                route.fulfill(body="<p>Inert callback</p>", content_type="text/html")
                            else:
                                route.abort()

                        page.route("**/*", live_route)
                        page.goto("https://app.muon3d.com/fleet", wait_until="domcontentloaded")
                        page.wait_for_function("window.done")
                        page.wait_for_load_state("networkidle")
                        assert len(navigations) == 1
                        assert len(answers) == 1 and answers[0].status == 303
                        location = urlsplit(answers[0].headers["location"])
                        assert parse_qs(location.query)["error"] == ["login_required"]
                        assert page.evaluate("localStorage.getItem('muon.cloud.token')") is None
                        assert page.locator("#app").inner_text() == "App shown"
                        context.close()
                        print("PASS live signed-out: real console 303; one document; no token or printer request")
                finally:
                    browser.close()
        finally:
            gate.set()
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == "__main__":
    main()
