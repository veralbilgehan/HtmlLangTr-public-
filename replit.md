# Overview

Bu uygulama çok şirketli, Türkçe bir personel performans takip sistemidir. React, Express ve Microsoft SQL Server (MSSQL) kullanılarak geliştirilmiştir. Vardiya takibi, GPS konum kaydı, aktivite loglaması, mesai ayarları ve şirket içi mesajlaşma özellikleri içerir.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and bundler.

**Routing**: Wouter for client-side routing.

**State Management**: 
- TanStack Query (React Query) for server state management and API caching
- Local React state for UI-specific state
- localStorage for persisting user authentication data

**UI Components**: shadcn/ui component library with Radix UI primitives, styled with Tailwind CSS.

**Styling**: Tailwind CSS with custom CSS variables for theming.

**Form Handling**: React Hook Form with Zod for validation.

## Backend Architecture

**Server Framework**: Express.js with TypeScript.

**Authentication**: 
- Passport.js with Local Strategy for username/password authentication
- Express Session with MemoryStore for session management
- Authentication state maintained both server-side (session) and client-side (localStorage)

**API Design**: RESTful API endpoints under `/api` namespace with JSON payloads.

**File Upload**: Multer middleware — 10MB limit, files stored in `uploads/`.

**Database Layer**: 
- `mssql` npm package for direct SQL Server access
- Repository pattern via `DatabaseStorage` class in `server/storage.ts`
- Connection pooling via `mssql.ConnectionPool`
- All SQL uses parameterized queries for security

## Data Storage

**Database**: Microsoft SQL Server (MSSQL)
- Host: bigshare.tr, Port: 8000
- Credentials stored as environment variables: MSSQL_HOST, MSSQL_PORT, MSSQL_USER, MSSQL_PASSWORD, MSSQL_DATABASE

**Table Initialization**: Run `migrations/mssql-init.sql` on the MSSQL server to create all tables.

**Schema Design**:
- `companies` - Şirket bilgileri
- `users` - Employee accounts with role-based access (employee/manager/superadmin), departments, profile info
- `activity_types` - Configurable activity categories per company
- `shifts` - Work shift tracking with start/end times, duration, GPS coordinates
- `activities` - Granular activity logging during shifts
- `sales_records` - Sales/performance records
- `company_settings` - Mesai saatleri, geç kalma uyarı metinleri
- `messages` - Internal 1-to-1 messaging with file attachment support
- `groups` - Company group chats
- `group_members` - Many-to-many group membership
- `group_messages` - Messages within groups

**Type Safety**: TypeScript interfaces in `shared/schema.ts` + Zod schemas for API validation.

## Build & Deployment

**Development**:
- Vite dev server for frontend (port 5000)
- TSX for running TypeScript server code directly
- HMR for rapid frontend development

**Production Build**:
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server code

## External Dependencies

**Database**: Microsoft SQL Server via `mssql` npm package (tedious driver)

**UI Component Libraries**:
- Radix UI, Lucide React, shadcn/ui

**Session Storage**: MemoryStore (express-session)

**File Processing**: Multer

**Validation**: Zod

**Date Handling**: date-fns

**Maps**: Leaflet / react-leaflet for GPS tracking
