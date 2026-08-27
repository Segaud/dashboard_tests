# Playwright Test Suite

This repository contains a Playwright automation test suite created as part of my QA automation learning and portfolio work.

## What it demonstrates

- Playwright browser automation
- Login and dashboard test coverage
- Test organisation using folders
- Use of Playwright config
- GitHub Actions workflow setup

## Tech stack

- JavaScript
- Node.js
- Playwright
- GitHub Actions

## How to run

```bash
npm install
npx playwright install
npx playwright test

- tests/dashboard_tests/tests has my login tests and create account tests

When instructed to, paste verification code sent to the email, into verification-code.txt and save the file. This text is then deleted once its been used to create an account.
