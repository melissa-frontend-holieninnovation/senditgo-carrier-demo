import hashlib
import importlib.util
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    'sync_upstream', Path(__file__).with_name('sync-upstream.py')
)
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class SyncUpstreamTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        self.git('init', '-q')
        self.git('config', 'user.name', 'Test')
        self.git('config', 'user.email', 'test@example.invalid')
        self.write(
            'index.html', '<script src="/senditgo-fleet-demo/assets/new.js"></script>'
        )
        self.write('404.html', 'location.replace("/senditgo-fleet-demo/")')
        self.write('.nojekyll', '')
        self.write('assets/new.js', 'const base="/senditgo-fleet-demo/";')
        self.write('assets/font.woff2', b'\x00\xff\x01')
        for directory in ['brand', 'demo', 'geo']:
            self.write(directory + '/fixture.json', '{"base":"/senditgo-fleet-demo/"}')
        self.write('.github/workflows/pages.yml', 'upstream workflow')
        self.write('prepare-deployment.mjs', 'upstream deploy script')
        self.write('map-config.js', "window.__FLEET_MAP_CONFIG__ = { publicToken: '' };\n")
        self.write('sam-review/sam/film.mp4', b'\x00/senditgo-fleet-demo/\xff')
        self.write('walkthrough/captions.vtt', 'WEBVTT\n/senditgo-fleet-demo/walkthrough/')
        self.write('demo/urls.json', '["https://example.com/senditgo-fleet-demo/foo","/senditgo-fleet-demo/foo"]')
        self.write_manifest()
        self.git('add', '.')
        self.git('commit', '-qm', 'Upstream fixture')

    def write_manifest(self):
        entries = {
            str(p.relative_to(self.repo)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in self.repo.rglob('*') if p.is_file()
            and not any(part in {'.git', '.github'} for part in p.relative_to(self.repo).parts)
            and p.name not in {'prepare-deployment.mjs', 'pages-files.json'}
        }
        self.write('pages-files.json', json.dumps(entries))

    def git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.repo, text=True).strip()

    def write(self, name, content):
        path = self.repo / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content if isinstance(content, bytes) else content.encode())

    def snapshot(self):
        return {
            str(p.relative_to(self.repo)): p.read_bytes()
            for p in self.repo.rglob('*')
            if p.is_file() and '.git' not in p.relative_to(self.repo).parts
        }

    def test_sync_rewrites_paths_removes_old_assets_and_preserves_local_pipeline(self):
        self.write('assets/old.js', 'stale')
        self.git('add', 'assets/old.js')
        self.write('.github/workflows/pages.yml', 'local workflow')
        self.write('prepare-deployment.mjs', 'local deploy script')
        sync.sync_upstream(self.repo, 'HEAD')
        self.assertFalse((self.repo / 'assets/old.js').exists())
        self.assertIn(
            '/senditgo-carrier-demo/assets/new.js',
            (self.repo / 'index.html').read_text(),
        )
        self.assertIn('/senditgo-carrier-demo/', (self.repo / '404.html').read_text())
        self.assertIn(
            '/senditgo-carrier-demo/', (self.repo / 'assets/new.js').read_text()
        )
        self.assertEqual(
            (self.repo / 'assets/font.woff2').read_bytes(), b'\x00\xff\x01'
        )
        self.assertEqual(
            (self.repo / '.github/workflows/pages.yml').read_text(), 'local workflow'
        )
        self.assertEqual(
            (self.repo / 'prepare-deployment.mjs').read_text(), 'local deploy script'
        )
        self.assertEqual(
            (self.repo / '.upstream-revision').read_text().strip(),
            self.git('rev-parse', 'HEAD'),
        )
        self.assertEqual((self.repo / 'sam-review/sam/film.mp4').read_bytes(), b'\x00/senditgo-fleet-demo/\xff')
        self.assertIn('/senditgo-carrier-demo/', (self.repo / 'walkthrough/captions.vtt').read_text())
        self.assertEqual((self.repo / 'demo/urls.json').read_text(), '["https://example.com/senditgo-fleet-demo/foo","/senditgo-carrier-demo/foo"]')
        manifest = json.loads((self.repo / 'pages-files.json').read_text())
        self.assertEqual(manifest['assets/new.js'], hashlib.sha256((self.repo / 'assets/new.js').read_bytes()).hexdigest())
        before = self.snapshot()
        sync.sync_upstream(self.repo, 'HEAD')
        self.assertEqual(self.snapshot(), before)

    def test_stages_new_files_and_removes_retired_manifest_entries(self):
        self.git('switch', '-qc', 'next')
        self.git('rm', 'sam-review/sam/film.mp4')
        self.write('new-route/index.html', 'new route')
        self.write_manifest()
        self.git('add', 'new-route', 'pages-files.json')
        self.git('commit', '-qm', 'Updated release')
        self.git('switch', '-q', '-')
        self.write('README.md', 'local instructions')
        sync.sync_upstream(self.repo, 'next', stage=True)
        changes = self.git('diff', '--cached', '--name-status', '--no-renames').splitlines()
        self.assertIn('D\tsam-review/sam/film.mp4', changes)
        self.assertIn('A\tnew-route/index.html', changes)
        self.assertFalse(any('README.md' in entry for entry in changes))
        self.assertFalse((self.repo / 'sam-review/sam/film.mp4').exists())

    def test_rejects_invalid_digest_without_changes(self):
        manifest = json.loads((self.repo / 'pages-files.json').read_bytes())
        manifest['index.html'] = '0' * 64
        self.write('pages-files.json', json.dumps(manifest))
        self.git('add', 'pages-files.json')
        self.git('commit', '-qm', 'Bad digest')
        before = self.snapshot()
        with self.assertRaisesRegex(ValueError, 'Upstream digest mismatch'):
            sync.sync_upstream(self.repo, 'HEAD')
        self.assertEqual(self.snapshot(), before)

    def test_rejects_control_files_and_unsafe_paths(self):
        manifest = json.loads((self.repo / 'pages-files.json').read_bytes())
        for path in ['../a', 'a/../b', 'README.md', '.github/workflows/pages.yml', 'prepare-deployment.mjs']:
            with self.subTest(path=path), self.assertRaisesRegex(ValueError, 'Unexpected public asset'):
                sync.load_inventory(json.dumps({**manifest, path: '0' * 64}))

    def test_public_token_is_injected_only_into_a_verified_artifact(self):
        sync.sync_upstream(self.repo, 'HEAD')
        script = Path(__file__).resolve().parents[2] / 'prepare-deployment.mjs'
        shutil.copyfile(script, self.repo / script.name)
        token = 'pk.fixture.example'
        env = {**os.environ, 'MAPBOX_PUBLIC_TOKEN': token, 'RUNNER_TEMP': self.temp.name}
        command = ['node', script.name, '--require-mapbox']
        result = subprocess.run(command, cwd=self.repo, env=env, capture_output=True, text=True, check=True)
        self.assertNotIn(token, result.stdout + result.stderr)
        artifact = Path(result.stdout.strip())
        files = json.loads((artifact / 'pages-files.json').read_bytes())
        self.assertEqual(set(files), set(json.loads((self.repo / 'pages-files.json').read_bytes())))
        for path, checksum in files.items():
            self.assertEqual(hashlib.sha256((artifact / path).read_bytes()).hexdigest(), checksum)
        self.assertIn(token, (artifact / 'map-config.js').read_text())
        self.assertNotIn(token, (self.repo / 'map-config.js').read_text())
        self.assertFalse((artifact / 'prepare-deployment.mjs').exists())
        self.write('index.html', 'mutated after synchronization')
        rejected = subprocess.run(command, cwd=self.repo, env=env, capture_output=True)
        self.assertNotEqual(rejected.returncode, 0)
        self.assertIn(b'digest mismatch', rejected.stderr)

    def test_invalid_upstream_does_not_modify_site(self):
        self.git('rm', 'index.html')
        self.git('commit', '-qm', 'Incomplete upstream')
        self.write('index.html', 'last good deployment')
        before = self.snapshot()
        with self.assertRaises(subprocess.CalledProcessError):
            sync.sync_upstream(self.repo, 'HEAD')
        self.assertEqual(self.snapshot(), before)

    def test_symlink_is_rejected_before_modifying_site(self):
        (self.repo / 'assets/link').symlink_to('/etc/passwd')
        manifest = json.loads((self.repo / 'pages-files.json').read_text())
        manifest['assets/link'] = '0' * 64
        self.write('pages-files.json', json.dumps(manifest))
        self.git('add', 'assets/link', 'pages-files.json')
        self.git('commit', '-qm', 'Invalid upstream symlink')
        (self.repo / 'assets/link').unlink()
        before = self.snapshot()
        with self.assertRaises(ValueError):
            sync.sync_upstream(self.repo, 'HEAD')
        self.assertEqual(self.snapshot(), before)


if __name__ == '__main__':
    unittest.main()
