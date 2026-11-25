# LabPlan — Process Lab build planning

Website: https://yousefmahajna.github.io/interconnect-process-lab/lab-build-plan/

Main website: https://yousefmahajna.github.io/interconnect-process-lab/

This standalone website is hosted in its own folder inside the Process Lab repository. It uses plain HTML, CSS and JavaScript and needs no dependencies or build step.

## Features

- Editable January–February timeline, with a configurable planning year and working week.
- Products, machines, module quantities, priorities, practical engineers, vacations and training.
- Product, person and machine views with consistent product colors and a side legend.
- One bar per product; click to edit its steps or use Edit all steps to update product, dates, quantity and priority together.
- Drag a build to reschedule it; dragging a product moves all its steps together.
- Large P1–P4 badges. Products sort P1, P2, P3, P4, then time away/training, then unscheduled products without priority labels.
- Working-day capacity and warnings for overlapping person or machine assignments.
- Browser-local saving and JSON export/import.

## Bring your current plan to this website

1. Open the original LabPlan website in the browser where you edited your plan.
2. Click **Export plan** to download its JSON file.
3. Open this GitHub Pages website and click **Import** to select that file.

Browser data belongs to a website origin. The migration does not automatically copy a plan saved on the original ChatGPT Site. Source files contain generic sample data; no private browser plan is committed. Export a backup before changing browsers or clearing storage. This app does not currently synchronize plans between users or devices.

## Files

- index.html — application layout and editing dialogs.
- app.js — planner, validation, scheduling, persistence and import/export.
- style.css — responsive layout, product colors and priority badges.
- tests/planning.test.cjs — scheduling, bulk editing, sorting and color consistency checks.
- package.json — check and test commands, with no dependencies.

## Local preview and checks

Serve this folder with any static HTTP server, or open index.html directly. Run checks with Node 24:

```sh
npm run check
npm test
```

The root Pages workflow deploys this folder with the hub. The LabPlan checks workflow validates changes independently. Return to the hub by clicking the LabPlan logo.

## Planning rules

Each activity reserves assigned resources for full working days. Training and vacations count as occupied person-days. The product quantity shown is its largest stage quantity, so the same modules are not counted repeatedly across stages. Separate batches can be represented as separate products. A product uses the highest priority among its stages; P1 = Critical, P2 = High, P3 = Normal, P4 = Low. Blank mixed fields in the bulk editor preserve each step's existing value.

The hub's Users list controls its application links. The planner itself is a static browser-local tool and does not enforce authenticated roles. Do not treat a hub permission label as access control for this URL.
