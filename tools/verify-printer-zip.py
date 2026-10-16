#!/usr/bin/env python3
"""Independently verify the provenance and contents of a printer release zip."""
from __future__ import annotations

import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import stat
import sys
import zipfile

CONTROL = "https://control.muon3d.com"

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

def verify(zip_path: Path, expected_sha: str, expected_commit: str, expected_size: int | None) -> None:
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
        for required in ("index.html", "build-info.json", "config.json", ".vite/manifest.json"):
            if required not in names:
                if required == "build-info.json":
                    fail("zip predates build-info.json and cannot be verified")
                fail(f"zip is missing {required}")
        try:
            index = archive.read("index.html").decode("utf-8")
            build_info = json.loads(archive.read("build-info.json"))
            config = json.loads(archive.read("config.json"))
            manifest = json.loads(archive.read(".vite/manifest.json"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            fail(f"invalid build metadata: {error}")
        parser = AssetParser()
        parser.feed(index)
        missing = sorted(asset for asset in parser.assets if asset not in names)
        if missing: fail(f"index.html referenced asset is missing: {missing[0]}")
        manifest_assets: set[str] = set()
        if not isinstance(manifest, dict): fail("Vite manifest is not an object")
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

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip", type=Path)
    parser.add_argument("expected_sha256")
    parser.add_argument("expected_commit")
    parser.add_argument("--expected-size", type=int)
    args = parser.parse_args()
    try: verify(args.zip, args.expected_sha256, args.expected_commit, args.expected_size)
    except (VerificationError, OSError, zipfile.BadZipFile) as error:
        print(f"verification failed: {error}", file=sys.stderr)
        return 1
    print(f"verified {args.zip}: {args.expected_sha256}, {args.zip.stat().st_size} bytes, commit {args.expected_commit}")
    print("note: config.json is checked for printer shape; this does not independently prove its provenance because the build inputs share a checkout")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
