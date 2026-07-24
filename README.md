# Plain HTML XFCE Browser VM

This is a complete GitHub Pages repository.

It contains:

- A real committed `index.html`
- A real `.github/workflows/pages.yml`
- Plain JavaScript and CSS
- No React
- No Svelte
- No npm
- Alpine Linux 3.20
- XFCE
- A persistent per-browser disk overlay
- Optional Tailscale network access

## VM accounts

Desktop user:

- Username: `user`
- Password: `webvm`

Administrator:

- Username: `root`
- Password: `root`

The desktop user logs in automatically.

## Deploy

In repository settings, set:

`Pages > Source > GitHub Actions`

Then push to `main`. The workflow builds the XFCE disk and deploys the site.

The workflow deliberately does not run `actions/configure-pages`, because this
site uses only relative paths and that action caused a false 404 in the old
repository.

## Visitor behavior

Each visitor runs a separate VM locally in their browser. Changes are stored in
that visitor's IndexedDB. The `Reset VM` button deletes only that visitor's
saved changes.
