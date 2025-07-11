# Bracket of Death Score Tracking Application

## Project Goal

The primary goal of this project is to create a web application for tracking and managing tennis tournament scores for the "Bracket of Death" tournament. This application will serve as a centralized platform for storing, viewing, and modifying tournament data, eventually replacing the current reliance on JSON files and spreadsheets.

## Current State

Existing tournament data is stored in a collection of JSON files located in the `./json` directory (e.g., `2023-08-12 M.json`, `All Players.json`, etc.). Some data is also in Excel files.

## Proposed Architecture

A typical web application architecture will be adopted:

1.  **Frontend:** A single-page application (SPA) built with modern web technologies.
2.  **Backend:** An API layer to handle requests from the frontend, process data, and interact with the database.
3.  **Database:** A relational or NoSQL database to store all tournament data (players, matches, scores, etc.).

This architecture will be designed with containerization (Docker) in mind from the outset.

## Technologies

*   **Frontend:**
    *   TypeScript: For robust and type-safe JavaScript development.
    *   Tailwind CSS: For rapid and utility-first styling.
    *   React: A popular JavaScript library for building user interfaces.
*   **Backend:**
    *   Node.js (with TypeScript): For building the API layer.
*   **Database:**
    *   MongoDB: A NoSQL database to store tournament data.
*   **Containerization:**
    *   Docker: For packaging the application components (frontend, backend, database) into portable containers for consistent development and deployment environments.

## Development Methodology

Test-Driven Development (TDD) will be the primary development methodology. This involves writing tests before writing the code they test. This approach helps ensure code quality, maintainability, and reduces bugs.

*   **Unit Tests:** To test individual functions and components.
*   **Integration Tests:** To test the interaction between different parts of the application (e.g., frontend communicating with backend, backend interacting with the database).
*   **End-to-End Tests:** To simulate user flows through the entire application.

## Key Features (Initial Scope)

*   Data Migration: Process and migrate existing JSON data into the chosen database schema.
*   Data Input Form: A web interface for manually entering new tournament data (match results, player information).
*   Data Modification Interface: A web interface to edit existing tournament data.
*   Data Viewing: Interfaces to view historical tournament data, player statistics, brackets, etc. (Scope may be refined later).

## Development Steps (High-Level)

1.  Define Database Schema: Design the database structure to accommodate tournament data.
2.  Set up Database: Install and configure the chosen database system.
3.  Implement Data Migration Script: Write a script or application component to read the JSON files and populate the database.
4.  Set up Backend API: Develop the backend API endpoints for data input, modification, and retrieval.
5.  Develop Frontend Components: Build the user interfaces using TypeScript and Tailwind CSS.
6.  Implement TDD Cycle: Write tests, write code, refactor, repeat.
7.  Create Dockerfiles: Define Docker images for each component (frontend, backend, database).
8.  Set up Docker Compose: Configure Docker Compose to orchestrate the multi-container application.

## Authentication and Authorization

Given the need for secure data entry and modification, user authentication is required. To ensure a robust and modern solution without building it from scratch, a third-party authentication service will be used. This approach offloads the complexity of user management, secure password handling, and potentially integration with external identity providers (like Google or Microsoft, if desired for user convenience, but managed through the service rather than personal accounts).

*   **Strategy:** Utilize Google Sign-In (via Google Identity Platform on Google Cloud Platform) for user authentication. This leverages Google's robust and secure identity infrastructure.
*   **Features:** Google Sign-In will handle user login and provide verified user identity information (primarily email and a unique Google User ID). The backend (Node.js) will be responsible for verifying the authenticity of the Google-provided tokens and implementing the application-specific authorization logic to restrict data modification actions to a predefined set of authorized users (likely based on a list of authorized email addresses or Google User IDs stored within the application's database or configuration).

## Database Schema

Based on the existing JSON data, the MongoDB schema will consist of three main collections:

### `players` Collection

*   Purpose: To store unique player information and career statistics.
*   Schema:
    *   `_id`: `ObjectId` (Primary Key)
    *   `name`: `String` (Player's full name, used for linking)
    *   `bodsPlayed`: `Number`
    *   `bestResult`: `Number`
    *   `avgFinish`: `Number`
    *   `gamesPlayed`: `Number`
    *   `gamesWon`: `Number`
    *   `winningPercentage`: `Number`
    *   `individualChampionships`: `Number` (Nullable, default 0)
    *   `divisionChampionships`: `Number` (Nullable, default 0)
    *   `totalChampionships`: `Number` (Nullable, default 0)
    *   `drawingSequence`: `Number` (Nullable)
    *   `pairing`: `String` (Nullable)

### `tournaments` Collection

*   Purpose: To store general information about each specific tournament event.
*   Schema:
    *   `_id`: `ObjectId` (Primary Key)
    *   `date`: `Date`
    *   `bodNumber`: `Number`
    *   `format`: `String`
    *   `location`: `String`
    *   `advancementCriteria`: `String`
    *   `notes`: `String` (Nullable)
    *   `photoAlbums`: `String` (Nullable)

### `tournamentResults` Collection

*   Purpose: To store the performance details of each team within a specific tournament.
*   Schema:
    *   `_id`: `ObjectId` (Primary Key)
    *   `tournamentId`: `ObjectId` (Reference to `tournaments` collection)
    *   `players`: `Array` of `ObjectId` (References to `players` collection)
    *   `division`: `String` (Nullable)
    *   `seed`: `Number` (Nullable)
    *   `roundRobinScores`: `Object` (Embedded Document)
        *   `round1`: `Number` (Nullable)
        *   `round2`: `Number` (Nullable)
        *   `round3`: `Number` (Nullable)
        *   `rrWon`: `Number` (Nullable)
        *   `rrLost`: `Number` (Nullable)
        *   `rrPlayed`: `Number` (Nullable)
        *   `rrWinPercentage`: `Number` (Nullable)
        *   `rrRank`: `Number` (Nullable)
    *   `bracketScores`: `Object` (Embedded Document, nullable fields)
        *   `r16Won`: `Number`
        *   `r16Lost`: `Number`
        *   `qfWon`: `Number`
        *   `qfLost`: `Number`
        *   `sfWon`: `Number`
        *   `sfLost`: `Number`
        *   `finalsWon`: `Number`
        *   `finalsLost`: `Number`
        *   `bracketWon`: `Number`
        *   `bracketLost`: `Number`
        *   `bracketPlayed`: `Number`
    *   `totalStats`: `Object` (Embedded Document)
        *   `totalWon`: `Number`
        *   `totalLost`: `Number`
        *   `totalPlayed`: `Number`
        *   `winPercentage`: `Number`
        *   `finalRank`: `Number` (Nullable)
        *   `bodFinish`: `Number` (Nullable)
        *   `home`: `Boolean` (Nullable)

## Backend API Routes

The backend will expose RESTful API endpoints to interact with the database. Authentication will be required for routes that create, update, or delete data. Authorization logic will be implemented to restrict these actions to authorized users.

*   **Players:**
    *   `GET /api/players`: Get all players.
    *   `GET /api/players/:id`: Get a single player by ID.
    *   `POST /api/players`: Create a new player (Authenticated/Authorized).
    *   `PUT /api/players/:id`: Update a player by ID (Authenticated/Authorized).
    *   `DELETE /api/players/:id`: Delete a player by ID (Authenticated/Authorized).

*   **Tournaments:**
    *   `GET /api/tournaments`: Get all tournaments.
    *   `GET /api/tournaments/:id`: Get a single tournament by ID.
    *   `POST /api/tournaments`: Create a new tournament (Authenticated/Authorized).
    *   `PUT /api/tournaments/:id`: Update a tournament by ID (Authenticated/Authorized).
    *   `DELETE /api/tournaments/:id`: Delete a tournament by ID (Authenticated/Authorized).

*   **Tournament Results:**
    *   `GET /api/tournamentResults`: Get all tournament results (can add query parameters for filtering by tournament or player).
    *   `GET /api/tournamentResults/:id`: Get a single tournament result by ID.
    *   `POST /api/tournamentResults`: Create a new tournament result (Authenticated/Authorized).
    *   `PUT /api/tournamentResults/:id`: Update a tournament result by ID (Authenticated/Authorized).
    *   `DELETE /api/tournamentResults/:id`: Delete a tournament result by ID (Authenticated/Authorized).
    *   `GET /api/tournaments/:tournamentId/results`: Get all results for a specific tournament.
    *   `GET /api/players/:playerId/results`: Get all results for a specific player across tournaments.

*   **Data Migration:**
    *   `POST /api/data/migrate`: Trigger the data migration process (Authenticated/Authorized - likely an admin function).

## Dependencies

### Backend (Node.js/TypeScript)

*   `express`: Web application framework for handling routes and requests.
*   `mongoose`: MongoDB object modeling tool.
*   `dotenv`: To load environment variables from a `.env` file.
*   `google-auth-library`: Library for verifying Google Identity tokens.
*   `cors`: To enable Cross-Origin Resource Sharing.
*   `@types/express`: TypeScript type definitions for Express (Dev Dependency).
*   `@types/mongoose`: TypeScript type definitions for Mongoose (Dev Dependency).
*   `@types/cors`: TypeScript type definitions for Cors (Dev Dependency).
*   `typescript`: TypeScript compiler (Dev Dependency).
*   `ts-node`: TypeScript execution environment for Node.js (Dev Dependency).
*   `nodemon`: Utility that monitors for changes in your source and automatically restarts your server (Dev Dependency).
*   `jest`: JavaScript testing framework (Dev Dependency).
    `@types/jest`: TypeScript type definitions for Jest (Dev Dependency).
*   `ts-jest`: Jest transformer with source map support for TypeScript (Dev Dependency).

### Frontend (React/TypeScript)

*   `react`: JavaScript library for building user interfaces.
*   `react-dom`: Entry point to the DOM and server renderers for React.
*   `react-router-dom`: For handling routing within the single-page application.
*   `@react-oauth/google` or similar: React hook/component for Google Sign-In.
*   `axios` or `fetch`: HTTP client for making API requests to the backend.
*   `tailwindcss`: Utility-first CSS framework (Dev Dependency).
*   `react-scripts` (or Vite): Development build tools (Dev Dependency).
*   `typescript`: TypeScript compiler (Dev Dependency).
*   `@types/react`: TypeScript type definitions for React (Dev Dependency).
    `@types/react-dom`: TypeScript type definitions for React DOM (Dev Dependency).


## Future Considerations

*   More sophisticated bracket generation and visualization.
*   Integration with external tennis data sources (if applicable).
*   Improved performance and scalability.

## For AI Collaborators

This document serves as a foundational plan. When contributing, please adhere to the following:

*   Consult this document for project goals, technologies, and methodology.
*   Prioritize implementing features using TDD.
*   Ensure code is written with Dockerization in mind (e.g., configurable ports, environment variables).
*   Document any proposed changes or additions to this plan.
*   Utilize the available tools to interact with the codebase (reading files, editing files, running commands).
```