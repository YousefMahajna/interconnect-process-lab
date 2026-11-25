# Interconnect Process Lab

The main page that links to every lab platform. Each platform, including Lab Build Plan, has its own repository and deployment. This repository hosts the main Process Lab page and application links.

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

The Adhesive Inventory tile passes only the selected NVIDIA email in a marked URL fragment. Adhesives reads the latest shared permission list and policy itself, then enters directly in Viewer or Editor mode (Editor/Manager/Administrator map to its Editor role). Denied or failed lookups remain blocked. The ordinary Adhesives URL retains its selector. The handoff does not carry a token or trust a role from the URL, and it does not verify mailbox ownership. Saving inventory uses a separate authenticated GitHub connection in Adhesives.

The top account bar provides Sign in, Change email, and Sign out. Enter a NVIDIA email to select its existing Users-list identity; known names appear automatically while typing and in the header. Unlisted valid NVIDIA emails display as "NVIDIA user" and follow the general rules. Names are not guessed from email addresses or looked up in a company directory. This remains unverified email selection, not corporate authentication.

Everyone sees the same application catalog, including signed-out visitors. Signed-out circles open the top sign-in form. After email selection, each circle shows that person's level. Applications with No access and the Users circle for non-administrators stay visible but locked, without a destination link or enabled management action. Missing application links remain placeholders. Only the owner can open Users. Changing accounts and signing out disconnect shared GitHub saving and preserve browser drafts for later recovery.

The Administrator sees a **Users** circle alongside the applications. The Users screen has one row per user and application: name, NVIDIA email, application, and permission level. Search listed users by name or email (case insensitive), and combine that search with the Application filter. Selecting an application also includes All applications grants; there is a separate option for only those grants. The result count refers to permission rows. Filtering does not change saved data or the rows included in exports and shared saves. Adding a row clears the text search and uses the selected application so the new row is visible.

- Viewer: view information.
- Editor: view and edit information.
- Manager: manage one application.
- Administrator: manage all applications and the Users list.

Yousef Mahajna (`ymahajna@nvidia.com`) is the reserved Administrator for all applications. His entry cannot be removed, renamed, or downgraded in the editor. Other users can have different levels for different applications, or a level for All applications. If grants overlap, the highest level applies.

The email selector accepts only the exact `@nvidia.com` domain (case insensitive). The General NVIDIA users controls set the fallback for each application: No access, Viewer, Editor, or Manager. Until configured, the defaults are Viewer for Adhesive Inventory (`adhesives`), Lab Activities (`activities`), and Process Recipe Library (`recipes`), and No access for Practical Engineers and X-Section. General rules are stored as `*@nvidia.com` permission rows for one specific application and appear in the separate general controls. The wildcard cannot be used to sign in.

Personal application rules take precedence over the general fallback. A personal No access row explicitly denies that application even with an all-applications grant; otherwise the highest matching personal grant wins. A personal all-applications No access rule blocks entry unless a specific application is granted. The owner always remains Administrator. These are hub presentation permissions, not authentication or enforcement within a destination application.

### Excel export and import

Use the back-arrow **Main page** button to return from Users to the application list without discarding the browser draft.

**Export Excel** downloads an `.xlsx` with one worksheet per application, independent of the table filters. Each worksheet contains:
- An application ID and format label, which must remain unchanged for import.
- A General NVIDIA users row with Can enter (Yes/No) and Level.
- Every currently listed user's name, NVIDIA email, Can enter, and effective level for that application. Denied entries read No / No access. Your Administrator entry is fixed.

Edit the Yes/No and level dropdowns in Excel, then use **Import Excel**. Import validates every worksheet before showing a summary. **Apply to draft** replaces the current application permission draft, preserving the owner; it does not publish. Review the table and general controls, then connect GitHub and **Save changes** to publish. Cancel leaves the current draft unchanged.

Import represents listed users as explicit per-application permissions, including No access, for the current applications. It expands previous all-applications grants into those application-specific values and does not create grants for future applications. Unlisted users follow the imported general rule. The current effective permissions survive an unchanged export/import round trip. Changing a general rule later affects users without personal rules; imported personal rows keep their own level.

Import supports ordinary `.xlsx` files up to 2 MB with the exported application sheets and plain values. Missing/duplicate applications, invalid NVIDIA emails or levels, duplicate user emails on a sheet, formulas, macros/external links, and owner demotion are rejected without changing the draft. Excel shared strings and inline strings are supported. ZIP size and entry limits bound parsing. Files are processed locally in the browser, using vendored JSZip 3.10.1; its license is included in `vendor/JSZip-LICENSE.md`.

### Publish Users changes

1. Select your NVIDIA email and open **Users**.
2. Add a user/application row, enter a full name and NVIDIA email, and choose an application and level.
3. Click **Connect GitHub**, create a fine-grained GitHub token for the YousefMahajna account selecting only `interconnect-process-lab` and **Contents: Read and write**, enter it in the website's password field and click **Connect account**. The input clears and the connection form closes. This connection is separate from Codex.
4. Click **Save changes**. You can save repeatedly without reentering credentials while the page stays open. Save is disabled until connected and never automatically opens the connection form. Disconnecting, changing email, refreshing or closing the page ends the connection.
5. A successful save commits the shared file to `main`. The current table updates immediately, and new visits read the latest file directly from GitHub, even while Pages is publishing.
6. Wait for the success message before leaving. Errors retain the edits and explain the problem.

Copy and Download remain backup options; they do not save changes. Unsaved edits warn before leaving. Names are required, one name must be used consistently for each email, and duplicate email/application rows are rejected. Saves preserve the latest platform fields and reject stale permission edits rather than overwriting another change. GitHub's file SHA also protects against concurrent writes.

The browser verifies that the token belongs to the fixed YousefMahajna GitHub account when connecting and saving. Tokens are sent only to `api.github.com` in authorization headers and held only in a private page-memory variable while connected. They are never stored in local/session storage or repository files; the input clears after a connection attempt. Authentication failures end the connection. Enter tokens only in the website, never in chat. A token can be revoked in GitHub settings. Repository rules must permit updates to `main` for direct saves; if not, the page shows an error and retains the edits. Shared saving still requires a credential; removing the automatic setup prompt does not provide token-free authentication.

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


### Activities entry from Process Lab

The Activities tile passes the selected email in the URL fragment to the owned `lab-activity-tracker` site. The application reads the latest shared permissions and skips its legacy entry form for this route: Viewer is read-only, Editor uses the existing lab role, and Manager/Administrator uses the manager role. The ordinary Activities URL retains its Guest/Lab/Manager entry screen. Missing or denied permissions block hub entry without restoring a legacy session. Activities uses a separate explicit, memory-only GitHub connection for publishing pending changes.

### Recipe Library entry from Process Lab

The Recipe Library tile passes only the selected email in the URL fragment to the owned `Process-Recipe-Library` site. The Library loads the latest shared permission: Viewer is read-only; Editor, Manager and Administrator use its existing Editor capabilities. Hub entry hides manual role switches and does not recover an Editor draft into a Viewer session. The ordinary Library URL keeps its original role controls. Internal Library tabs preserve the handoff on reload. No Users grants or Firebase configuration are changed.



## Lab Build Plan

The Lab Build Plan tile opens [LabPlan](https://yousefmahajna.github.io/lab-build-plan/), maintained and deployed from [YousefMahajna/lab-build-plan](https://github.com/YousefMahajna/lab-build-plan). The old `/interconnect-process-lab/lab-build-plan/` address redirects there. Both addresses share the same origin and `labplan-v1` browser storage key, preserving existing plans in the same browser. The hub keeps its original homepage and Users grants. Plans remain browser-local; source deployment does not copy personal browser data.
