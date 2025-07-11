# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the "Bracket of Death" tennis tournament score tracking web application. The project aims to replace the current JSON file-based data storage with a modern web application using React, TypeScript, Node.js, and MongoDB.

## Current State

The project is in early development stages with:
- Historical tournament data stored in JSON files in the `json/` directory (2009-2024)
- Basic Node.js setup with TypeScript and TailwindCSS dependencies
- Comprehensive planning document at `docs/PLANNING.md`

## Key Architecture

The planned architecture follows a typical web application pattern:
- **Frontend**: React SPA with TypeScript and TailwindCSS
- **Backend**: Node.js/Express API with TypeScript
- **Database**: MongoDB for tournament data storage
- **Authentication**: Google Sign-In integration
- **Containerization**: Docker for deployment

## Data Structure

The JSON files contain tournament data with this structure:
- Tournament files: `YYYY-MM-DD [Format].json` (e.g., "2024-07-20 M.json")
- Aggregate files: "All Players.json", "All Scores.json", "Champions.json"
- Each tournament record includes player teams, round-robin scores, bracket results, and final rankings

## Development Commands

**Current available commands:**
- `npm test` - Currently shows error (no tests configured yet)

**Development setup** (based on planning):
- TypeScript compilation: `tsc` (when tsconfig.json exists)
- TailwindCSS build: Requires configuration file setup
- Testing: Will use Jest with ts-jest transformer

## Database Schema (Planned)

Three main MongoDB collections:
- `players`: Individual player statistics and career data
- `tournaments`: Tournament metadata (date, format, location)
- `tournamentResults`: Team performance data for each tournament

## Authentication Strategy

Google Sign-In will be implemented for secure data entry, with authorization based on predefined email addresses for tournament data modification.

## Development Methodology

The project follows Test-Driven Development (TDD) principles. When implementing features:
1. Write tests first
2. Implement code to pass tests
3. Refactor as needed
4. Ensure Docker compatibility

## Data Migration

A critical early task is migrating existing JSON data to the MongoDB database. The migration script should preserve all historical data while transforming it to match the new schema.

## Important Notes

- All development should consider Docker containerization from the start
- Use environment variables for configuration (ports, database connections)
- Maintain backward compatibility with existing data during migration
- Follow the established patterns in `docs/PLANNING.md` for any architectural decisions