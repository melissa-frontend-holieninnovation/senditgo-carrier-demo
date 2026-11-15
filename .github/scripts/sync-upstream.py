import io
import shutil
import subprocess
import tarfile
import tempfile
from pathlib import Path

SITE_ENTRIES = ('index.html', '404.html', '.nojekyll', 'assets', 'brand', 'demo', 'geo')
TEXT_SUFFIXES = {'.html', '.js', '.css', '.json', '.svg', '.geojson', '.webmanifest'}
SOURCE_BASE = b'/senditgo-fleet-demo/'
TARGET_BASE = b'/senditgo-carrier-demo/'


def sync_upstream(repo, revision):
    sha = subprocess.check_output(
        ['git', 'rev-parse', '--verify', revision + '^{commit}'], cwd=repo, text=True
    ).strip()
    archive = subprocess.check_output(
        ['git', 'archive', sha, '--', *SITE_ENTRIES], cwd=repo
    )
    with tempfile.TemporaryDirectory() as directory:
        staging = Path(directory)
        with tarfile.open(fileobj=io.BytesIO(archive)) as bundle:
            for member in bundle.getmembers():
                path = Path(member.name)
                if path.is_absolute() or '..' in path.parts:
                    raise ValueError('Unsafe upstream path: ' + member.name)
                if member.isdir():
                    continue
                if not member.isfile():
                    raise ValueError('Upstream site must contain regular files only')
                content = bundle.extractfile(member).read()
                if path.suffix in TEXT_SUFFIXES:
                    content = content.replace(SOURCE_BASE, TARGET_BASE)
                target = staging / path
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(content)
        for name in SITE_ENTRIES:
            if not (staging / name).exists():
                raise ValueError('Missing upstream site entry: ' + name)
        if TARGET_BASE not in (staging / 'index.html').read_bytes():
            raise ValueError('Upstream index no longer matches the expected base path')
        for name in SITE_ENTRIES:
            target = repo / name
            if target.is_symlink() or target.is_file():
                target.unlink()
            elif target.is_dir():
                shutil.rmtree(target)
            shutil.move(str(staging / name), str(target))
    (repo / '.upstream-revision').write_text(sha + '\n')
    print('Synced upstream revision ' + sha)


if __name__ == '__main__':
    sync_upstream(Path.cwd(), 'refs/remotes/source/main')
