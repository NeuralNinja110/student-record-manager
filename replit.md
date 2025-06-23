# Student Management System

## Overview

This is a full-stack Student Management System built with React (frontend) and Express.js (backend). The application provides comprehensive student management capabilities including student registration, subject enrollment, marks management, and performance reporting. It uses PostgreSQL as the database with Drizzle ORM for type-safe database operations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful API with JSON responses
- **Validation**: Zod schemas for runtime type checking
- **Development**: Hot reload with tsx and Vite middleware integration

## Key Components

### Database Schema
- **Students**: Core student information (name, student ID, class, section)
- **Subjects**: Subject definitions with codes and maximum marks
- **Enrollments**: Many-to-many relationship between students and subjects
- **Marks**: Assessment scores (CAT1, CAT2, FAT) with calculated totals and percentages

### API Endpoints
- **Students**: CRUD operations with search and filtering capabilities
- **Subjects**: Subject management
- **Enrollments**: Student-subject enrollment management
- **Marks**: Marks entry and calculation
- **Reports**: Performance statistics and analytics

### Frontend Views
- **Students View**: Student listing, search, and management
- **Enrollment View**: Subject enrollment for students
- **Marks View**: Grade entry and calculation
- **Reports View**: Performance analytics and statistics

## Data Flow

1. **User Interaction**: Users interact with React components
2. **API Calls**: TanStack Query manages HTTP requests to Express API
3. **Database Operations**: Express routes use Drizzle ORM to interact with PostgreSQL
4. **Response Handling**: Data flows back through the same path with automatic caching

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **react-hook-form**: Form state management
- **zod**: Runtime type validation

### Development Tools
- **drizzle-kit**: Database schema management and migrations
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production builds

## Deployment Strategy

### Development
- Uses Vite dev server with Express middleware integration
- Hot module replacement for frontend changes
- Automatic server restart with tsx for backend changes

### Production
- Frontend builds to static files served by Express
- Backend bundles with esbuild for optimal performance
- Designed for autoscale deployment on Replit

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Replit-specific configurations for development and deployment
- PostgreSQL module provisioned in Replit environment

## Changelog

- June 23, 2025: Initial setup with PostgreSQL database and React frontend
- June 23, 2025: Fixed student ID generation to handle deleted students properly
- June 23, 2025: Resolved duplicate key constraint error in student creation
- June 23, 2025: Connected to Neon PostgreSQL database successfully
- June 23, 2025: Added sample subjects (Mathematics, Physics, Chemistry, Biology, English)

## User Preferences

Preferred communication style: Simple, everyday language.