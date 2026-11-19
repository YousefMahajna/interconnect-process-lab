# Interconnect Process Lab

The main page that links to every lab platform. Each platform keeps its own repo and its own deploy job. This repo only holds the hub.

Live page: https://yousefmahajna.github.io/interconnect-process-lab/

## How it works

- `index.html` is the hub page and Users editor. It does not need changes when adding a platform.
- `access-policy.js` holds the email and application-list rules.
- `github-store.js` loads the latest shared Users list and saves validated changes to GitHub using the Administrator's GitHub credential.
- `platforms.json` holds the platforms and user/application rows. This is the configuration file you edit.
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

## Users and application levels

The Administrator sees a **Users** circle alongside the applications. The Users screen has one row per user and application: name, NVIDIA email, application, and permission level. Search listed users by name or email (case insensitive); the result count refers to permission rows. Filtering does not change the saved data or the rows included in exports and shared saves. Adding a row clears the search so the new row is visible.

- Viewer: view information.
- Editor: view and edit information.
- Manager: manage one application.
- Administrator: manage all applications and the Users list.

Yousef Mahajna (`ymahajna@nvidia.com`) is the reserved Administrator for all applications. His entry cannot be removed, renamed, or downgraded in the editor. Other users can have different levels for different applications, or a level for All applications. If grants overlap, the highest level applies.

The email selector accepts only the exact `@nvidia.com` domain (case insensitive). Every NVIDIA email, including unlisted users, receives default Viewer access to Adhesive Inventory (`adhesives`), Lab Activities (`activities`), and Process Recipe Library (`recipes`). Explicit Editor/Manager permissions take precedence and the owner remains Administrator. Practical Engineers and X-Section still require explicit grants. Removing an explicit entry does not revoke the three default Viewer applications. This is hub presentation behavior, not authentication or enforcement within a destination application.

### Publish Users changes

1. Select your NVIDIA email and open **Users**.
2. Add a user/application row, enter a full name and NVIDIA email, and choose an application and level.
3. Click **Save changes**. The first time, open **GitHub save setup** and create a fine-grained GitHub token for the YousefMahajna account, selecting only `interconnect-process-lab` and **Contents: Read and write**. Enter the token in the website's password field, then click Save changes again.
4. A successful save commits the shared file to `main`. The current table updates immediately, and new visits read the latest file directly from GitHub, even while Pages is publishing.
5. Wait for the success message before leaving. Errors retain the edits and explain the problem.

Copy and Download remain backup options; they do not save changes. Unsaved edits warn before leaving. Names are required, one name must be used consistently for each email, and duplicate email/application rows are rejected. Saves preserve the latest platform fields and reject stale permission edits rather than overwriting another change. GitHub's file SHA also protects against concurrent writes.

The browser verifies that the token belongs to the fixed YousefMahajna GitHub account before saving. Tokens are sent only to `api.github.com` in authorization headers, never stored in local/session storage or repository files, and cleared from the input after a save attempt or leaving Users. Enter tokens only in the website, never in chat. A token can be revoked in GitHub settings. Repository rules must permit updates to `main` for direct saves; if not, the page shows an error and retains the edits.

### Browser draft recovery

Unfinished Users edits are automatically kept on the current browser under `ipl-users-draft-v1`. Refreshing the page, returning from the application list, or deploying a new revision does not discard that draft. Reopen Users to recover it. The editor clearly distinguishes a browser draft from a confirmed shared GitHub save. Browser drafts never affect the actual application list for any visitor.

Recovery combines the draft with newer saved entries using the original list as a baseline. It preserves unrelated changes and requires an explicit choice when both versions changed the same entry. Editing is paused until conflicts are resolved. **Discard draft** explicitly deletes the browser draft after confirmation; a successful shared save also removes it. Only grant fields are stored, never the GitHub token. Incomplete rows are preserved for correction. If browser storage is unavailable, the page tells the user to save or export before refreshing.

GitHub API documentation: [updating file contents](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents) and [fine-grained tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

### Security status and required next step

**This version is an application directory and Users editor, not a verified NVIDIA login system.** Anyone can select any NVIDIA email, including the Administrator address. Email-based checks and protected rows only protect the normal editing interface. Saving shared changes separately requires the verified owner GitHub account and repository write permission; selecting the owner email alone cannot save changes.

`platforms.json` and all files in this public repository are publicly readable. Do not put passwords, tokens, confidential user data, or authentication secrets here. The browser's stored email is a convenience only.

Before this can enforce access:
1. Connect a service that verifies mailbox ownership using an emailed code/link, or an approved NVIDIA work-account identity provider.
2. Store user grants in a protected shared service. Permit only the verified Administrator to change them and check permissions in that service on every operation.
3. Integrate verified sign-in and permission checks into **each linked application and its data service**. Hiding a hub link or displaying a Viewer badge does not prevent direct access or editing on the destination.
4. Retire the unverified email-selector path when verified sign-in is enabled.

A static GitHub Pages change alone cannot provide these protections. Sign-in service configuration and changes to the application repositories are separate required work.

### Development checks

Run `node --test tests/*.test.cjs` with Node 24. The checks workflow runs the same tests on pull requests and pushes to main. Tests cover presentation rules and persistence behavior, including credentials, concurrency conflicts, Unicode, and preserving existing platform fields. `access-policy.js` is not a security boundary; GitHub authorizes shared saves.

