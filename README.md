# SenditGo carrier demo

Live site: https://melissa-frontend-holieninnovation.github.io/senditgo-carrier-demo/

The **Sync and publish carrier demo** workflow checks
`melissacc213/senditgo-fleet-demo` branch `main` every 15 minutes (at minutes
7, 22, 37 and 52). GitHub may delay scheduled runs. It can also be started
manually from Actions, and runs on pushes to this repository's `main`.

The public release comes from the upstream `pages-files.json` inventory. Each
source checksum is verified before copying the application, SAM review, films,
captions and deep links. Assets dropped from the inventory are removed. HTML, scripts, styles and other text assets use the
`/senditgo-carrier-demo/` base path. Local workflows, sync tests and the deployment
script are preserved. The carrier inventory records the rewritten checksums. Do not edit the mirrored site files here; edit upstream.

The existing `MAPBOX_PUBLIC_TOKEN` Actions secret supplies the public browser map
configuration in the temporary Pages artifact. Git retains an empty public
configuration template. No personal GitHub token is needed. The workflow deploys directly,
then commits the synchronized files and `.upstream-revision` using `GITHUB_TOKEN`.
The deploy job checks the live `.upstream-revision` and the SHA-256 of
`pages-files.json` against the artifact before recording the exact source that
was built. A failed check leaves the revision pending for the next scheduled retry. Unchanged scheduled runs skip deployment.

GitHub disables schedules in public repositories after 60 days without repository
activity. If that happens, re-enable this workflow in Actions. See
[GitHub's schedule documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

## Guided tours

Open a tour in a browser window at least 1024 pixels wide.

- [Order Management](https://melissa-frontend-holieninnovation.github.io/senditgo-carrier-demo/run-management/order-management/?tour=order-management)
- [A dispatcher’s day](https://melissa-frontend-holieninnovation.github.io/senditgo-carrier-demo/?tour=dispatcher-day)
- [Roster](https://melissa-frontend-holieninnovation.github.io/senditgo-carrier-demo/roster/?tour=roster)
- [Route Planning](https://melissa-frontend-holieninnovation.github.io/senditgo-carrier-demo/run-management/route-planning/?tour=route-planning)

The workflow adds the guided tours from `.github/guided-tour/src` after preparing the upstream demo. The published inventory includes the final HTML and tour runtime hashes. Chrome follows each tour to its end screen before upload and again on the live site. Scheduled checks with no upstream changes compare the live tour assets with the version in this repository.
