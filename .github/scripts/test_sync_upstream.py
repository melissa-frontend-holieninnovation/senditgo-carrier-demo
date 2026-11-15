import importlib.util
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
        self.git('add', '.')
        self.git('commit', '-qm', 'Upstream fixture')

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
        before = self.snapshot()
        sync.sync_upstream(self.repo, 'HEAD')
        self.assertEqual(self.snapshot(), before)

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
        self.git('add', 'assets/link')
        self.git('commit', '-qm', 'Invalid upstream symlink')
        (self.repo / 'assets/link').unlink()
        before = self.snapshot()
        with self.assertRaises(ValueError):
            sync.sync_upstream(self.repo, 'HEAD')
        self.assertEqual(self.snapshot(), before)


if __name__ == '__main__':
    unittest.main()
