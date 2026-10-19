#!/usr/bin/env python3
"""Verify archive integrity and references reported by a printer build.

The archive's build-info.json and HTML report the commit, and build-info.json
reports cloudBaseUrl; these claims are compared with expected values but are
not checked against compiled code. config.json is checked only for hosted:false.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import stat
import sys
import zipfile
import zlib

CONTROL = "https://control.muon3d.com"
MANIFEST_COMMENT = b"fluidd-vite-manifest-v1:"
ASSET_REFERENCE = re.compile(
    r'''(?:["'])(?P<path>(?:/|\.\./|\./)?(?:assets/)?[A-Za-z0-9_./-]+\.(?:js|css|wasm|woff2?|ttf|png|svg|ico))(?:(?:\?[^"']*)?)["']'''
)

class VerificationError(Exception):
    """A release invariant was not met."""

class AssetParser(HTMLParser):
    ASSET_ATTRIBUTES = {"script": "src", "link": "href", "img": "src", "source": "src", "video": "poster", "object": "data"}
    def __init__(self) -> None:
        super().__init__()
        self.assets: set[str] = set()
    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        wanted = self.ASSET_ATTRIBUTES.get(tag)
        value = dict(attrs).get(wanted) if wanted else None
        if value and not value.startswith(("data:", "http://", "https://", "//", "#")):
            self.assets.add(value.split("?", 1)[0].split("#", 1)[0].lstrip("/"))

def fail(message: str) -> None:
    raise VerificationError(message)

def verify(zip_path: Path, expected_sha: str, expected_commit: str, expected_size: int | None) -> list[str]:
    if not re.fullmatch(r"[0-9a-f]{64}", expected_sha): fail("expected SHA256 must be 64 lowercase hexadecimal characters")
    if not re.fullmatch(r"[0-9a-f]{40}", expected_commit): fail("expected commit must be a full lowercase 40-character SHA")
    if not zip_path.is_file(): fail(f"zip does not exist: {zip_path}")
    size = zip_path.stat().st_size
    if size == 0: fail("zip size is zero")
    if expected_size is not None and size != expected_size: fail(f"zip size mismatch: expected {expected_size}, got {size}")
    actual_sha = hashlib.sha256(zip_path.read_bytes()).hexdigest()
    if actual_sha != expected_sha: fail(f"SHA256 mismatch: expected {expected_sha}, got {actual_sha}")
    try:
        archive = zipfile.ZipFile(zip_path)
    except zipfile.BadZipFile as error:
        fail(f"invalid zip: {error}")
    with archive:
        infos = archive.infolist()
        names: set[str] = set()
        for info in infos:
            name = info.filename
            pure = PurePosixPath(name.replace("\\", "/"))
            if name.startswith(("/", "\\")) or re.match(r"^[A-Za-z]:", name): fail(f"zip contains an absolute path: {name}")
            if ".." in pure.parts: fail(f"zip contains parent traversal: {name}")
            if stat.S_ISLNK(info.external_attr >> 16): fail(f"zip contains a symlink: {name}")
            if name in names: fail(f"zip contains a duplicate path: {name}")
            names.add(name)
            if name.endswith(".map"): fail(f"zip contains a source map: {name}")
            if any(part == ".env" or part.startswith(".env.") for part in pure.parts): fail(f"zip contains a leaked .env file: {name}")
        for required in ("index.html", "build-info.json", "config.json"):
            if required not in names:
                if required == "build-info.json":
                    fail("zip predates build-info.json and cannot be verified")
                fail(f"zip is missing {required}")
        try:
            index = archive.read("index.html").decode("utf-8")
            build_info = json.loads(archive.read("build-info.json"))
            config = json.loads(archive.read("config.json"))
            if not archive.comment.startswith(MANIFEST_COMMENT):
                fail("zip is missing its non-served Vite verification manifest")
            manifest = json.loads(zlib.decompress(base64.b64decode(
                archive.comment[len(MANIFEST_COMMENT):], validate=True
            )))
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError, zlib.error) as error:
            fail(f"invalid build metadata: {error}")
        parser = AssetParser()
        parser.feed(index)
        missing = sorted(asset for asset in parser.assets if asset not in names)
        if missing: fail(f"index.html referenced asset is missing: {missing[0]}")
        manifest_assets: set[str] = set()
        if not isinstance(manifest, dict): fail("Vite manifest is not an object")
        entries = [key for key, value in manifest.items() if isinstance(value, dict) and value.get("isEntry") is True]
        if entries != ["index.html"]: fail("Vite manifest must have exactly one isEntry entry for index.html")
        for entry in manifest.values():
            if not isinstance(entry, dict): fail("Vite manifest contains an invalid entry")
            for field in ("file", "css", "assets"):
                values = entry.get(field, [])
                if field == "file": values = [values]
                if not isinstance(values, list): fail(f"Vite manifest {field} is invalid")
                manifest_assets.update(value.lstrip("/") for value in values if isinstance(value, str))
        missing_manifest = sorted(manifest_assets - names)
        if missing_manifest: fail(f"manifest referenced asset is missing: {missing_manifest[0]}")
        if build_info.get("commit") != expected_commit: fail(f"build-info.json commit does not match {expected_commit}")
        if build_info.get("cloudBaseUrl") != CONTROL: fail(f"build-info.json cloudBaseUrl must be exactly {CONTROL}")
        meta = re.search(r'<meta\s+(?=[^>]*\bname=["\']fluidd-commit["\'])(?=[^>]*\bcontent=["\']([^"\']+)["\'])[^>]*>', index, re.IGNORECASE)
        if not meta or meta.group(1) != expected_commit: fail(f"fluidd-commit meta does not match {expected_commit}")
        if config.get("hosted") is not False: fail("config.json is not the printer config (the hosted server config is forbidden)")
        text_files: dict[str, str] = {}
        for info in infos:
            if info.filename.endswith((".js", ".html", ".json", ".css")):
                try: text_files[info.filename] = archive.read(info).decode("utf-8")
                except UnicodeDecodeError: fail(f"text asset is not UTF-8: {info.filename}")
        discovered: set[str] = set()
        chunk_workers: set[str] = set()
        monaco_workers: set[str] = set()
        for source_name, contents in text_files.items():
            source_dir = PurePosixPath(source_name).parent
            for match in ASSET_REFERENCE.finditer(contents):
                raw = match.group("path")
                if raw.startswith("/"):
                    resolved = raw.lstrip("/")
                elif raw.startswith(("./", "../")):
                    resolved = str(source_dir.joinpath(raw))
                    parts: list[str] = []
                    for part in PurePosixPath(resolved).parts:
                        if part == ".." and parts: parts.pop()
                        elif part not in (".", ".."): parts.append(part)
                    resolved = "/".join(parts)
                else:
                    resolved = raw
                # Workbox's generated service worker is an explicit inventory.
                # In application chunks, only worker URLs are in scope here;
                # arbitrary asset-like strings can be runtime fallback names.
                is_worker = "worker" in PurePosixPath(resolved).name.lower()
                if resolved.startswith("assets/") and (source_name == "sw.js" or is_worker):
                    discovered.add(resolved)
                    if is_worker and source_name != "sw.js": chunk_workers.add(resolved)
                # vite-plugin-monaco-editor writes its workers to
                # <base>monacoeditorwork/ outside Vite's manifest, and injects
                # their URLs into index.html as the MonacoEnvironment paths.
                if resolved.startswith("monacoeditorwork/"):
                    discovered.add(resolved)
                    if source_name == "index.html": monaco_workers.add(resolved)
        missing_discovered = sorted(discovered - names)
        if missing_discovered: fail(f"referenced asset is missing: {missing_discovered[0]}")

        checked = []
        checked.append("PWA sw.js precache references" if "sw.js" in names else "PWA sw.js (unchecked: not present)")
        checked.append("worker URLs referenced from chunks" if chunk_workers else "worker bundles (unchecked: no URL discoverable)")
        checked.append("Monaco editor workers under monacoeditorwork/ referenced from index.html" if monaco_workers else "Monaco editor workers (unchecked: no monacoeditorwork/ URL in index.html)")
        return checked

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip", type=Path)
    parser.add_argument("expected_sha256")
    parser.add_argument("expected_commit")
    parser.add_argument("--expected-size", type=int)
    args = parser.parse_args()
    try: checked = verify(args.zip, args.expected_sha256, args.expected_commit, args.expected_size)
    except (VerificationError, OSError, zipfile.BadZipFile) as error:
        print(f"verification failed: {error}", file=sys.stderr)
        return 1
    print(f"verified {args.zip}: {args.expected_sha256}, {args.zip.stat().st_size} bytes, reported commit {args.expected_commit}")
    print("checked: " + "; ".join(checked))
    print("limitations: cloudBaseUrl and the commit are reported by the build itself, not checked against compiled code; config.json is checked only for hosted:false and does not independently prove provenance")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
