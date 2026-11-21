import argparse
import hashlib
import json
import os
import re
import subprocess
import tarfile
import tempfile
from pathlib import Path

LEGACY_ENTRIES = ('index.html', '404.html', '.nojekyll', 'assets', 'brand', 'demo', 'geo')
REQUIRED = {'index.html', '404.html', '.nojekyll', 'map-config.js'}
TEXT_SUFFIXES = {'.html', '.js', '.css', '.json', '.svg', '.geojson', '.webmanifest', '.vtt'}
SOURCE_BASE = re.compile(rb'(?<![\w./%:-])/senditgo-fleet-demo/')
TARGET_BASE = b'/senditgo-carrier-demo/'
INVENTORY = 'pages-files.json'


def load_inventory(content):
    files = json.loads(content)
    if not isinstance(files, dict) or not REQUIRED.issubset(files):
        raise ValueError('Missing required Pages release entries')
    for name, digest in files.items():
        if name != '.nojekyll' and (
            not all(re.fullmatch(r'[A-Za-z0-9_@-][A-Za-z0-9@_.-]*', part) for part in name.split('/'))
            or name.split('/')[0] in {'README.md', 'prepare-deployment.mjs', INVENTORY}
        ):
            raise ValueError('Unexpected public asset path: ' + name)
        if not isinstance(digest, str) or not re.fullmatch('[0-9a-f]{64}', digest):
            raise ValueError('Invalid release checksum: ' + name)
    return files


def tracked_paths(repo, *paths):
    output = subprocess.check_output(['git', 'ls-files', '-z', '--', *paths], cwd=repo)
    return set(os.fsdecode(output).split('\0')) - {''}


def check_destination(repo, name):
    target = repo / name
    if target.is_symlink() or (target.exists() and not target.is_file()):
        raise ValueError('Unsafe local destination: ' + name)
    for parent in Path(name).parents:
        path = repo / parent
        if path.is_symlink() or (path.exists() and not path.is_dir()):
            raise ValueError('Unsafe local destination: ' + name)


def sync_upstream(repo, revision, stage=False):
    sha = subprocess.check_output(
        ['git', 'rev-parse', '--verify', revision + '^{commit}'], cwd=repo, text=True
    ).strip()
    manifest = load_inventory(subprocess.check_output(['git', 'show', sha + ':' + INVENTORY], cwd=repo))
    managed = tracked_paths(repo, *LEGACY_ENTRIES)
    check_destination(repo, INVENTORY)
    if (repo / INVENTORY).exists():
        managed.update(load_inventory((repo / INVENTORY).read_bytes()))
    stale = managed - manifest.keys()
    touched = set(manifest) | {INVENTORY, '.upstream-revision'}
    for name in stale | touched:
        check_destination(repo, name)

    with tempfile.TemporaryDirectory(dir=repo.parent) as directory:
        staging = Path(directory)
        with tempfile.TemporaryFile() as archive:
            subprocess.run(['git', 'archive', sha, '--', *manifest], cwd=repo, stdout=archive, check=True)
            archive.seek(0)
            normalized = {}
            with tarfile.open(fileobj=archive) as bundle:
                for member in bundle:
                    if member.isdir():
                        continue
                    if member.name not in manifest or not member.isfile():
                        raise ValueError('Unexpected upstream entry: ' + member.name)
                    data = bundle.extractfile(member).read()
                    if hashlib.sha256(data).hexdigest() != manifest[member.name]:
                        raise ValueError('Upstream digest mismatch: ' + member.name)
                    target = staging / member.name
                    if target.suffix in TEXT_SUFFIXES:
                        data = SOURCE_BASE.sub(TARGET_BASE, data)
                    normalized[member.name] = hashlib.sha256(data).hexdigest()
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(data)
        if normalized.keys() != manifest.keys() or TARGET_BASE not in (staging / 'index.html').read_bytes():
            raise ValueError('Incomplete or unexpected upstream site')
        (staging / INVENTORY).write_text(json.dumps(normalized, indent=2, sort_keys=True) + '\n')
        (staging / '.upstream-revision').write_text(sha + '\n')
        for name in touched:
            target = repo / name
            target.parent.mkdir(parents=True, exist_ok=True)
            (staging / name).replace(target)
        for name in stale:
            (repo / name).unlink(missing_ok=True)

    if stage:
        to_stage = touched | (stale & tracked_paths(repo))
        subprocess.run(['git', 'add', '-A', '--', *sorted(to_stage)], cwd=repo, check=True)
    print(f'Synced {len(manifest)} public files from {sha}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--stage', action='store_true', help='Stage release files and managed deletions')
    sync_upstream(Path.cwd(), 'refs/remotes/source/main', stage=parser.parse_args().stage)
