# SenditGo carrier demo

Live site: https://melissa-frontend-holieninnovation.github.io/senditgo-carrier-demo/

The **Sync and publish carrier demo** workflow checks
`melissacc213/senditgo-fleet-demo` branch `main` every 15 minutes (at minutes
7, 22, 37 and 52). GitHub may delay scheduled runs. It can also be started
manually from Actions, and runs on pushes to this repository's `main`.

The static site directories are replaced with the upstream snapshot, including
asset deletions. HTML, scripts, styles and other text assets use the
`/senditgo-carrier-demo/` base path. Local workflows, sync tests and the deployment
script are preserved. Do not edit the mirrored site files here; edit upstream.

The existing `MAPBOX_PUBLIC_TOKEN` Actions secret supplies the public browser map
configuration. No personal GitHub token is needed. The workflow deploys directly,
then commits the synchronized files and `.upstream-revision` using `GITHUB_TOKEN`.
Recording the revision only after successful deployment lets the next scheduled
run retry a failed deployment. Unchanged scheduled runs skip deployment.

GitHub disables schedules in public repositories after 60 days without repository
activity. If that happens, re-enable this workflow in Actions. See
[GitHub's schedule documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
