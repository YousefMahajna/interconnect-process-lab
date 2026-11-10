# Interconnect Process Lab

The main page that links to every lab platform. Each platform keeps its own repo and its own deploy job. This repo only holds the hub.

Live page: https://yousefmahajna.github.io/interconnect-process-lab/

## How it works

- `index.html` is the hub page. It never changes when you add or update a platform.
- `platforms.json` is the list of platforms. This is the only file you edit.
- `.github/workflows/pages.yml` publishes the page to GitHub Pages every time you push to `main`.
- Each platform repo is updated and deployed on its own, as before. The hub reads each repo's last push date from GitHub and shows it as "Updated …" under the platform name.

## First-time setup

1. On GitHub, create a new public repo named `interconnect-process-lab`.
2. Upload everything in this folder to it, including the hidden `.github` folder.
3. Go to Settings, Pages, and set Source to **GitHub Actions**.
4. Open the Actions tab and wait for "Deploy hub to GitHub Pages" to finish.
5. Your hub is live at the link above.

## Add or change a platform

Edit `platforms.json` on GitHub (the pencil icon), add one entry, and commit. The hub updates in about a minute.

```json
{
  "id": "my-new-platform",
  "title": "My New Platform",
  "group": "Lab",
  "url": "https://yousefmahajna.github.io/my-new-platform/",
  "repo": "my-new-platform",
  "icon": "grid",
  "color": "#6D28D9"
}
```

- `icon` can be `drop`, `clipboard`, `users`, `layers`, `book` or `grid`.
- `repo` is optional. When set, the hub shows when that repo was last updated.
- Leave `url` empty to show "Link needed".

## X-Section

X-Section has no link yet. Put `xsection-lab.html` in its own repo as `index.html`, turn on Pages, then paste its link into the `url` and `repo` fields for `xsection` in `platforms.json`.
