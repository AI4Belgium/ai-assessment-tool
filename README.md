# AI Assessment Tool

- [AI Assessment Tool](#ai-assessment-tool)
  - [Overview](#overview)
    - [Demo](#demo)
  - [Features 🤩](#features-)
  - [Requirements](#requirements)
  - [Run the app](#run-the-app)
    - [Without Docker](#without-docker)
    - [With Docker-compose](#with-docker-compose)
  - [What's next 🚀](#whats-next-)
  - [Tech stacks](#tech-stacks)
  - [Contributing](#contributing)
  - [License](#license)
  - [Tests](#tests)
  - [Run a single file](#run-a-single-file)

## Overview

This application is an improvement on the [ALTAI tool](https://futurium.ec.europa.eu/en/european-ai-alliance/pages/welcome-altai-portal) with some additional features.

### [Demo](https://altai.ai4belgium.be/)

## Features 🤩

- Login/Register with JWT token authentication
- Ability to create/update/delete the project
- Ability to add/update/move/delete the card
- Invite user to the project
- Assign a card to the user
- Comment on cards

## Requirements

1. [Node.js](https://nodejs.org/)
2. [npm](https://www.npmjs.com/)
3. [Docker](https://www.docker.com/)

## Run the app

First install the MongoDB Compass for better visualization of data with MongoDB server.

1. Clone this repo using `git clone git@github.com:AI4Belgium/AI-Assessment-Tool.git`
2. Create _.env.local_ and add those env variables
    - Add `MONGODB_URI=mongodb://localhost:27017/altai`
      - you need to have an mongodb running on port 27017
      - you can use the one from the docker-compose file (port is 27019 then!!!) or just run one locally with docker
    - Add `JWT_SECRET_KEY=<TODO>`
    - Add `SMTP_HOST=<TODO>` // create an account on https://ethereal.email/ for a testing SMTP server
    - Add `SMTP_USER=<TODO>`
    - Add `SMTP_PASS=<TODO>`
    - Add `API_KEY=<TODO>`

### Without Docker

3. Run `yarn install`
4. Run `yarn dev`

### With Docker-compose

Install docker on your machine and start it

3. Run `docker-compose up`

## What's next 🚀

- Improve styling (responsiveness styling)
- Add Web Accessibility
- Add request validation
- Add database migration handling

## Tech stacks

- Nextjs with typescript
- MongoDB for local development
- Mongo Atlas for production DB
- Chakra UI library

## Contributing

All contributions are welcome!

## License

This project is licensed under the **MIT license**. Feel free to edit and distribute this template as you like.

See [LICENSE](LICENSE) for more information.

## Tests

```bash
# to run all tests
yarn test

# to run specific tests executed from the base directory
yarn test --rootDir $PWD __tests__/api/projects/index.test.ts "__tests__/api/auth/\[...nextauth\].test.ts"
```

## Run a single file

In order to run a single Typescript file from the project you need to include `-r tsconfig-paths/register` to have all paths defined in the `ts-config.json` working.
Otherwise all the `@/src/`, `@/pages/`, etc. paths will not work.

The package `tsconfig-paths` is included in the dev dependencies of the project.

```bash
ts-node -r tsconfig-paths/register <my-script>.ts
```
