#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "ruamel.yaml>=0.18.6",
# ]
# ///

from __future__ import annotations

import argparse
import sys
from importlib import import_module
from pathlib import Path
from typing import Any


YAML = import_module("ruamel.yaml").YAML
CommentedMap = import_module("ruamel.yaml.comments").CommentedMap
CommentedSeq = import_module("ruamel.yaml.comments").CommentedSeq


REPO_ROOT = Path(__file__).resolve().parents[1]
ROOT_APM = REPO_ROOT / "apm.yml"
PACKAGES_DIR = REPO_ROOT / "packages"


def load_yaml(path: Path) -> Any:
    yaml = YAML()
    yaml.preserve_quotes = True
    data = yaml.load(path)
    if not isinstance(data, CommentedMap):
        raise ValueError(f"{path} must contain a YAML mapping")
    return data


def package_entry(name: str, source: str) -> Any:
    entry = CommentedMap()
    entry["name"] = name
    entry["source"] = source
    return entry


def discover_packages(packages_dir: Path, root: Path) -> Any:
    entries = []
    names: set[str] = set()

    for manifest_path in sorted(packages_dir.glob("*/apm.yml")):
        package = load_yaml(manifest_path)
        name = package.get("name")
        if not isinstance(name, str) or not name.strip():
            raise ValueError(f"{manifest_path} must define a non-empty string name")
        if name in names:
            raise ValueError(f"duplicate package name: {name}")
        names.add(name)

        source = f"./{manifest_path.parent.relative_to(root).as_posix()}"
        entries.append(package_entry(name, source))

    if not entries:
        raise ValueError(f"no package manifests found in {packages_dir}")

    return CommentedSeq(sorted(entries, key=lambda entry: entry["name"]))


def render_yaml(data: Any) -> str:
    from io import StringIO

    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.indent(mapping=2, sequence=4, offset=2)
    yaml.width = 4096
    output = StringIO()
    yaml.dump(data, output)
    return output.getvalue()


def update_root_apm(root_apm: Path, packages_dir: Path, *, check: bool) -> bool:
    root = root_apm.parent
    data = load_yaml(root_apm)
    marketplace = data.get("marketplace")
    if not isinstance(marketplace, CommentedMap):
        raise ValueError(f"{root_apm} must define a marketplace mapping")

    marketplace["packages"] = discover_packages(packages_dir, root)
    updated = render_yaml(data)
    current = root_apm.read_text()

    if updated == current:
        return False

    if check:
        return True

    root_apm.write_text(updated)
    return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Update root apm.yml marketplace packages from packages/*/apm.yml."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit with an error if apm.yml is not already up to date.",
    )
    parser.add_argument(
        "--root-apm",
        type=Path,
        default=ROOT_APM,
        help="Path to the root apm.yml manifest.",
    )
    parser.add_argument(
        "--packages-dir",
        type=Path,
        default=PACKAGES_DIR,
        help="Directory containing package subdirectories.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        changed = update_root_apm(args.root_apm, args.packages_dir, check=args.check)
    except ValueError as error:
        print(f"error: {error}", file=sys.stderr)
        return 2

    if args.check and changed:
        print(
            f"{args.root_apm} is out of date; run uv run scripts/update_root_apm.py",
            file=sys.stderr,
        )
        return 1

    if changed:
        print(f"updated {args.root_apm}")
    else:
        print(f"{args.root_apm} is already up to date")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())