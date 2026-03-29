# Overview

This is a company internal employee management application built with React, Express, and PostgreSQL. The system provides performance tracking, shift management, activity logging, and internal messaging capabilities. It's designed to help companies monitor employee work hours, track activities, and facilitate internal communication.

The application uses a modern tech stack with TypeScript throughout, Vite for frontend bundling, Drizzle ORM for database operations, and shadcn/ui components for the user interface. The system is deployed on Replit and includes Replit-specific plugins for development experience.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and bundler.

**Routing**: Wouter for client-side routing - a minimal, hook-based routing solution chosen for its lightweight footprint.

**State Management**: 
- TanStack Query (React Query) for server state management and API caching
- Local React state for UI-specific state
- localStorage for persisting user authentication data

**UI Components**: shadcn/ui component library with Radix UI primitives, providing accessible, customizable components styled with Tailwind CSS.

**Styling**: Tailwind CSS with custom CSS variables for theming. The application supports a custom color scheme defined in `index.css` that maps brand colors to Tailwind's utility classes.

**Form Handling**: React Hook Form with Zod for validation, using `@hookform/resolvers` for schema integration.

## Backend Architecture

**Server Framework**: Express.js with TypeScript, configured to run in development mode with `tsx` and compiled for production with esbuild.

**Authentication**: 
- Passport.js with Local Strategy for username/password authentication
- Express Session for session management
- Sessions stored using `connect-pg-simple` (PostgreSQL session store)
- Authentication state maintained both server-side (session) and client-side (localStorage)

**API Design**: RESTful API endpoints under `/api` namespace with JSON payloads.

**File Upload**: Multer middleware for handling file uploads with:
- 10MB file size limit
- Type restrictions (images, PDFs, Office documents, text files)
- Files stored in local `uploads` directory
- Custom filename generation using timestamps and random suffixes

**Database Layer**: 
- Drizzle ORM for type-safe database operations
- Repository pattern implemented via `DatabaseStorage` class in `storage.ts`
- Connection pooling using Neon's serverless PostgreSQL driver with WebSocket support

## Data Storage

**Database**: PostgreSQL (configured for Neon serverless)

**Schema Design**:
- `users` - Employee accounts with role-based access (employee/manager), departments, and profile information
- `shifts` - Work shift tracking with start/end times, duration, and geolocation data
- `activities` - Granular activity logging during shifts with types, durations, and notes
- `messages` - Internal 1-to-1 messaging system with file attachment support and read status tracking
- `groups` - Company group chats (name, companyId, createdBy)
- `group_members` - Many-to-many: which users belong to which groups
- `group_messages` - Messages sent within a group (senderId, groupId, file support)

**Schema Management**: Drizzle Kit for migrations, with schemas defined in TypeScript and validated using Zod.

**Type Safety**: Full end-to-end type safety from database schema to frontend using Drizzle-Zod integration for runtime validation.

## Build & Deployment

**Development**:
- Concurrent development with Vite dev server for frontend (port 5000)
- TSX for running TypeScript server code directly
- Hot Module Replacement (HMR) for rapid frontend development
- Vite middleware mode for serving frontend through Express in development

**Production Build**:
- Frontend: Vite builds optimized static assets to `dist/public`
- Backend: esbuild bundles server code to single CJS file with selective dependency bundling
- Allowlist strategy for critical dependencies to reduce cold start times
- Static file serving from Express in production

**Deployment Platform**: Optimized for Replit with:
- Custom Vite plugins for Replit-specific features (error modal, cartographer, dev banner)
- Meta image plugin for dynamic OpenGraph image URLs based on deployment domain
- Environment-specific configurations

## External Dependencies

**Database Provider**: Neon Serverless PostgreSQL
- WebSocket-based connection using `@neondatabase/serverless`
- Connection pooling for performance
- Configured via `DATABASE_URL` environment variable

**UI Component Libraries**:
- Radix UI - Unstyled, accessible component primitives
- Lucide React - Icon library
- shadcn/ui - Pre-styled component library built on Radix UI

**Development Tools**:
- Replit-specific Vite plugins for enhanced development experience
- TypeScript for type safety across the stack
- ESLint and Prettier (implied by setup)

**Session Storage**: PostgreSQL via `connect-pg-simple` for production-grade session persistence.

**File Processing**: Multer for multipart form data handling and file uploads.

**Validation**: Zod for runtime type validation of API inputs and database schemas.

**Date Handling**: date-fns for date manipulation and formatting.