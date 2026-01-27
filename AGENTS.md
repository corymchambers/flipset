# Agent Instructions

Instructions for AI agents (Claude Code, etc.) working on this project.

## Project Overview

Flipset is a React Native flashcard app built with Expo. It features:
- Offline-first with SQLite database
- Rich text editing for card content
- Voice input and OCR text extraction
- Spaced repetition review sessions
- Import/export functionality

## Tech Stack

- **Framework**: React Native with Expo SDK 54+
- **Routing**: expo-router (file-based)
- **Database**: expo-sqlite
- **Styling**: StyleSheet with theme constants
- **State**: React hooks + custom useSession hook

## Project Structure

```
app/                    # Screens (file-based routing)
  (tabs)/               # Tab navigation screens
  card/                 # Card create/edit screens
  category/             # Category create/edit screens
  review/               # Review session screen
components/             # Reusable components
  ui/                   # Generic UI components (Button, Card, etc.)
  cards/                # Card-related components
  categories/           # Category-related components
  editor/               # Rich text editor components
  review/               # Review session components
constants/              # Theme, constants
database/               # SQLite database operations
hooks/                  # Custom React hooks
types/                  # TypeScript type definitions
```

## Design System

- **Theme**: Dark-only with pure black background (#0a0a0a)
- **Primary color**: Cyan (#22D3EE)
- **Use theme constants** from `constants/theme.ts`
- **Use the `useTheme` hook** for accessing colors

## Key Conventions

1. **Components**: Functional components with TypeScript
2. **Styling**: Use StyleSheet.create, apply theme colors inline
3. **Database**: All DB operations go through `database/` functions
4. **Navigation**: Use expo-router's `router.push()`, `router.back()`

## When Adding Features

1. **Update TESTING.md** with new test cases for the feature
2. **Follow existing patterns** in similar components
3. **Use existing UI components** from `components/ui/`
4. **Add types** to `types/index.ts` if needed

## When Fixing Bugs

1. **Explain before fixing**: Before making any code changes, explain:
   - What the bug is (root cause)
   - What the proposed fix would be
   - Wait for approval before implementing
2. **Check TESTING.md** for related test cases
3. **Add new test cases** if the bug scenario wasn't covered
4. **Test related functionality** to avoid regressions

## Building

- **Dev**: `npx expo start`
- **Prebuild** (after adding native deps): `npx expo prebuild`
- **Android APK**: `cd android && ./gradlew assembleRelease`
- **iOS**: Open in Xcode, build for device

## Files to Keep Updated

- **TESTING.md**: Add test cases for new features
- **README.md**: Update build instructions if process changes
- **agents.md**: Update if conventions or structure changes
