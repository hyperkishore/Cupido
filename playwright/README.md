# Playwright End-to-End Tests

## Prerequisites

- Install dependencies: `npm install`
- Install Playwright browsers (one time): `npx playwright install`

## Running locally

```bash
npm run test:e2e
```

This command will:

- Launch the Expo web app in demo mode on `http://localhost:8081`
- Execute the test suite across Desktop Chrome, Desktop Safari, Pixel 5 (mobile Chrome) and iPhone 12 (mobile Safari) viewports

For the inspector UI run:

```bash
npm run test:e2e:ui
```

To reuse an already running Expo web server set `PLAYWRIGHT_WEB_COMMAND` to `false` and `PLAYWRIGHT_BASE_URL` to the existing origin before running the tests.

## CI integration

When integrating with GitHub Actions set `CI=1` so retries are enabled and the Expo server is re-created each run. Collect the `playwright-report` directory as an artifact for HTML results.
