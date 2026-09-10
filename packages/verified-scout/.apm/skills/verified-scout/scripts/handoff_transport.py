#!/usr/bin/env python3
"""Store, read, and delete verified-scout handoffs in a private user cache."""

import argparse
import hashlib
import os
from pathlib import Path
import re
import secrets
import stat
import sys
import tempfile

MAX_HANDOFF_BYTES = 1024 * 1024
_ROOT_NAME = "verified-scout"
_NAMESPACE_RE = re.compile(r"repo-[A-Za-z0-9._-]{1,40}-[0-9a-f]{16}\Z")
_FILENAME_RE = re.compile(r"handoff-[0-9a-f]{32}\.bin\Z")


def _repository_root(value):
    candidate = Path(value).expanduser()
    try:
        candidate = candidate.resolve(strict=True)
    except (OSError, RuntimeError) as exc:
        raise ValueError("repository path does not exist: {}".format(value)) from exc
    if not candidate.is_dir():
        raise ValueError("repository path is not a directory: {}".format(value))

    for directory in (candidate,) + tuple(candidate.parents):
        if (directory / ".git").exists():
            return directory
    return candidate


def _namespace(repository):
    root = _repository_root(repository)
    identity = os.path.normcase(str(root))
    digest = hashlib.sha256(identity.encode("utf-8")).hexdigest()[:16]
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "-", root.name).strip(".-")
    if not safe_name:
        safe_name = "repository"
    safe_name = safe_name[:40]
    return "repo-{}-{}".format(safe_name, digest)


def _user_cache_root():
    if "VERIFIED_SCOUT_CACHE_DIR" in os.environ:
        root = Path(os.environ["VERIFIED_SCOUT_CACHE_DIR"])
        if not root.is_absolute():
            raise ValueError("VERIFIED_SCOUT_CACHE_DIR must be an absolute path")
        return root

    if os.name == "nt":
        local_app_data = Path(os.environ.get("LOCALAPPDATA", ""))
        if not local_app_data.is_absolute():
            raise ValueError("LOCALAPPDATA must be an absolute path")
        return local_app_data / _ROOT_NAME

    if sys.platform == "darwin":
        return Path.home() / "Library" / "Caches" / _ROOT_NAME

    xdg_cache_home = Path(os.environ.get("XDG_CACHE_HOME", ""))
    if xdg_cache_home.is_absolute():
        return xdg_cache_home / _ROOT_NAME
    return Path.home() / ".cache" / _ROOT_NAME


def _create_private_directory(path):
    path.mkdir(mode=0o700, parents=True, exist_ok=True)
    metadata = path.lstat()
    if stat.S_ISLNK(metadata.st_mode) or not stat.S_ISDIR(metadata.st_mode):
        raise ValueError("private cache path must be a non-symlink directory")
    try:
        path.chmod(0o700)
    except OSError:
        pass


def _managed_root(repository, create=False):
    namespace = _namespace(repository)
    cache_root = _user_cache_root()
    root = cache_root / namespace
    if create:
        _create_private_directory(cache_root)
        _create_private_directory(root)
    return root.resolve()


def _validated_path(repository, value, require_file=True):
    supplied = Path(value).expanduser()
    if not supplied.is_absolute():
        raise ValueError("handoff path must be absolute")

    root = _managed_root(repository)
    try:
        path = supplied.resolve(strict=require_file)
    except (OSError, RuntimeError) as exc:
        raise ValueError("invalid handoff path: {}".format(value)) from exc

    if path.parent != root or not _NAMESPACE_RE.fullmatch(root.name):
        raise ValueError("refusing path outside this repository's managed cache root")
    if not _FILENAME_RE.fullmatch(path.name):
        raise ValueError("refusing path not created by verified-scout")

    if require_file:
        try:
            metadata = supplied.lstat()
        except OSError as exc:
            raise ValueError("handoff file is unavailable: {}".format(value)) from exc
        if stat.S_ISLNK(metadata.st_mode) or not stat.S_ISREG(metadata.st_mode):
            raise ValueError("handoff path must be a regular, non-symlink file")
    return path


def _store(repository):
    root = _managed_root(repository, create=True)
    payload = sys.stdin.buffer.read(MAX_HANDOFF_BYTES + 1)
    if len(payload) > MAX_HANDOFF_BYTES:
        raise ValueError(
            "handoff exceeds the {} byte limit".format(MAX_HANDOFF_BYTES)
        )

    final_path = root / "handoff-{}.bin".format(secrets.token_hex(16))
    descriptor, staging_name = tempfile.mkstemp(prefix=".staging-", dir=str(root))
    staging_path = Path(staging_name)
    try:
        try:
            os.fchmod(descriptor, 0o600)
        except (AttributeError, OSError):
            pass
        with os.fdopen(descriptor, "wb") as stream:
            descriptor = -1
            stream.write(payload)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(str(staging_path), str(final_path))
        try:
            final_path.chmod(0o600)
        except OSError:
            pass
    finally:
        if descriptor != -1:
            os.close(descriptor)
        try:
            staging_path.unlink()
        except FileNotFoundError:
            pass

    print(str(final_path.resolve()))


def _read(repository, value):
    path = _validated_path(repository, value)
    if path.stat().st_size > MAX_HANDOFF_BYTES:
        raise ValueError("managed handoff exceeds the size limit")
    with path.open("rb") as stream:
        payload = stream.read(MAX_HANDOFF_BYTES + 1)
    if len(payload) > MAX_HANDOFF_BYTES:
        raise ValueError("managed handoff exceeds the size limit")
    sys.stdout.buffer.write(payload)


def _delete(repository, value):
    path = _validated_path(repository, value)
    path.unlink()


def _parser():
    parser = argparse.ArgumentParser(
        description="Manage verified-scout handoffs in a repository-scoped user cache."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    store = subparsers.add_parser("store", help="atomically store stdin")
    store.add_argument("--repository", required=True, help="path within the repository")

    read = subparsers.add_parser("read", help="write a managed handoff to stdout")
    read.add_argument("--repository", required=True, help="path within the repository")
    read.add_argument("path", help="absolute managed handoff path")

    delete = subparsers.add_parser("delete", help="delete a managed handoff")
    delete.add_argument("--repository", required=True, help="path within the repository")
    delete.add_argument("path", help="absolute managed handoff path")
    return parser


def main():
    arguments = _parser().parse_args()
    try:
        if arguments.command == "store":
            _store(arguments.repository)
        elif arguments.command == "read":
            _read(arguments.repository, arguments.path)
        else:
            _delete(arguments.repository, arguments.path)
    except (OSError, ValueError) as exc:
        print("handoff transport: {}".format(exc), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
