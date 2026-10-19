#!/usr/bin/env python3
"""Embed a compressed Vite manifest in ZIP metadata, never the served tree."""

import argparse
import base64
from pathlib import Path
import zipfile
import zlib


MARKER = b"fluidd-vite-manifest-v1:"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip", type=Path)
    parser.add_argument("manifest", type=Path)
    args = parser.parse_args()
    comment = MARKER + base64.b64encode(zlib.compress(args.manifest.read_bytes(), level=9))
    if len(comment) > 65535:
        raise SystemExit("compressed manifest is too large for ZIP metadata")
    with zipfile.ZipFile(args.zip, "a") as archive:
        archive.comment = comment


if __name__ == "__main__":
    main()
