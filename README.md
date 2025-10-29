# Ande Frontend

This is the frontend for the AndeLabs project, built with Next.js.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v20 or later)
-   [npm](https://www.npmjs.com/)

### Installation

1.  Clone the repository:
    ```bash
    git clone git@github.com:AndeLabs/andefrontend.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd andefrontend
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

## Available Scripts

In the project directory, you can run the following commands:

-   `npm run dev`: Runs the app in development mode.
-   `npm run build`: Builds the app for production.
-   `npm run start`: Starts the production server.
-   `npm run lint`: Lints the code.
-   `npm run format`: Formats the code with Prettier.
-   `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
-   `npm run prepare`: Sets up Husky for pre-commit hooks.
-   `npm run validate`: Validates the deployment.
-   `npm run clean`: Removes the `.next` directory and `node_modules/.cache`.
-   `npm run analyze`: Analyzes the bundle size.

## Folder Structure

```
.
├── public/
│   └── ... # Static assets
├── src/
│   ├── app/
│   │   └── ... # Application routes
│   ├── components/
│   │   └── ... # Reusable components
│   ├── lib/
│   │   └── ... # Utility functions and libraries
│   └── ...
├── ...
```
