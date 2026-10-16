#!/usr/bin/env python3
"""Compare every file served by a printer with an immutable fluidd.zip."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import socket
import sys
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
import zipfile


LARGE_FILE = 1024 * 1024
VERSION_RE = re.compile(rb"\b(?:VERSION|version)\s*[:=]\s*[\"']([^\"']+)[\"']")


class NoRedirects(HTTPRedirectHandler):
    """Make redirects visible rather than turning them into another request."""

    def redirect_request(self, req: Request, fp: Any, code: int, msg: str,
                         headers: Any, newurl: str) -> None:
        return None


def validate_base_url(value: str) -> str:
    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("BASE_URL must use http or https")
    if not parsed.hostname or parsed.username is not None or parsed.password is not None:
        raise ValueError("BASE_URL must have a host and must not contain credentials")
    if parsed.path or parsed.query or parsed.fragment:
        raise ValueError("BASE_URL must not contain a path, query, or fragment")
    # urllib's default HTTPS handling verifies certificates. Deliberately offer
    # no insecure/certificate-override switch.
    return value


def fetch(opener: Any, url: str, timeout: float, retries: int) -> tuple[str, bytes | None, int | None, str | None]:
    for attempt in range(retries + 1):
        try:
            request = Request(url, method="GET", headers={"Accept": "*/*", "User-Agent": "Muon3D-printer-byte-check/1"})
            with opener.open(request, timeout=timeout) as response:
                return "ok", response.read(), response.status, None
        except HTTPError as error:
            if 300 <= error.code < 400:
                return "redirect", None, error.code, error.headers.get("Location")
            if error.code == 404:
                return "missing", None, error.code, None
            if error.code >= 500 and attempt < retries:
                time.sleep(0.2 * (attempt + 1))
                continue
            return "http_error", None, error.code, None
        except (URLError, TimeoutError, socket.timeout) as error:
            if attempt == retries:
                return "network_error", None, None, str(error)
            time.sleep(0.2 * (attempt + 1))
    raise AssertionError("unreachable")


def check(base_url: str, zip_path: Path, timeout: float, retries: int) -> dict[str, Any]:
    report: dict[str, Any] = {
        "baseUrl": base_url,
        "zip": str(zip_path),
        "exactMatch": False,
        "served": {"commit": None, "cloudBaseUrl": None, "hosted": None},
        "serviceWorker": None,
        "files": {},
        "errors": [],
    }
    opener = build_opener(NoRedirects())
    try:
        archive = zipfile.ZipFile(zip_path)
    except (OSError, zipfile.BadZipFile) as error:
        report["errors"].append(f"cannot open zip: {error}")
        return report

    with archive:
        infos = [info for info in archive.infolist() if not info.is_dir()]
        archive_names = {info.filename for info in infos}
        for required in ("build-info.json", "index.html", "config.json"):
            if required not in archive_names:
                report["errors"].append(f"zip is missing required file: {required}")
        served_contents: dict[str, bytes] = {}
        for info in infos:
            name = info.filename
            path = PurePosixPath(name)
            if name.startswith("/") or ".." in path.parts:
                report["files"][name] = {"status": "unsafe_zip_path"}
                report["errors"].append(f"unsafe zip path: {name}")
                continue
            expected = archive.read(info)
            encoded_path = "/".join(quote(part, safe="") for part in path.parts)
            status, actual, http_status, detail = fetch(opener, f"{base_url}/{encoded_path}", timeout, retries)
            item: dict[str, Any] = {"status": status, "size": None, "expectedSize": len(expected)}
            if http_status is not None:
                item["httpStatus"] = http_status
            if detail:
                item["detail"] = detail
            if actual is not None:
                served_contents[name] = actual
                item["size"] = len(actual)
                if len(expected) >= LARGE_FILE:
                    expected_hash = hashlib.sha256(expected).hexdigest()
                    actual_hash = hashlib.sha256(actual).hexdigest()
                    item.update({"comparison": "sha256", "expectedSha256": expected_hash, "servedSha256": actual_hash})
                    matches = expected_hash == actual_hash
                else:
                    item["comparison"] = "bytes"
                    matches = actual == expected
                item["status"] = "match" if matches else "mismatch"
            report["files"][name] = item
            if item["status"] != "match":
                report["errors"].append(f"{name}: {item['status']}")

        def served_json(name: str) -> dict[str, Any] | None:
            try:
                return json.loads(served_contents[name])
            except (KeyError, UnicodeDecodeError, json.JSONDecodeError):
                return None

        build_info = served_json("build-info.json")
        config = served_json("config.json")
        if build_info is not None:
            report["served"]["commit"] = build_info.get("commit")
            report["served"]["cloudBaseUrl"] = build_info.get("cloudBaseUrl")
        else:
            report["errors"].append("served build-info.json is not valid JSON")
        if config is not None:
            report["served"]["hosted"] = config.get("hosted")
            if config.get("hosted") is not False:
                report["errors"].append("config.json must contain hosted:false")
        else:
            report["errors"].append("served config.json is not valid JSON with hosted:false")

        if "sw.js" in served_contents:
            contents = served_contents["sw.js"]
            match = VERSION_RE.search(contents)
            report["serviceWorker"] = {
                "path": "sw.js",
                "version": match.group(1).decode("utf-8", "replace") if match else None,
                "sha256": hashlib.sha256(contents).hexdigest(),
            }

    report["exactMatch"] = not report["errors"]
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_url", metavar="BASE_URL")
    parser.add_argument("--zip", required=True, type=Path, dest="zip_path")
    parser.add_argument("--out", type=Path, default=Path("printer-fluidd-report.json"))
    parser.add_argument("--timeout", type=float, default=10.0)
    parser.add_argument("--retries", type=int, default=2)
    args = parser.parse_args()
    try:
        if args.timeout <= 0 or args.retries < 0:
            raise ValueError("timeout must be positive and retries must not be negative")
        base_url = validate_base_url(args.base_url)
        report = check(base_url, args.zip_path, args.timeout, args.retries)
    except ValueError as error:
        report = {"baseUrl": args.base_url, "exactMatch": False, "errors": [str(error)]}
    try:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    except OSError as error:
        print(f"cannot write report: {error}", file=sys.stderr)
        return 1
    if report["exactMatch"]:
        print(f"exact match: {base_url} serves every byte in {args.zip_path}")
        return 0
    for error in report["errors"]:
        print(f"check failed: {error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
