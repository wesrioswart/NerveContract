# NEC4 Contract Management Platform

## Overview

This is a comprehensive AI-powered NEC4 contract management platform built with a full-stack TypeScript architecture. The system integrates contract intelligence, document management, real-time analytics, and specialized AI agents to streamline construction project management with intelligent contract handling and automated workflows.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration
- **State Management**: React Context (UserContext, ProjectContext) + TanStack Query for server state
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Framework**: Express.js with TypeScript (ESM modules)
- **Authentication**: Passport.js with local strategy and express-session
- **Template Engine**: EJS for PDF generation and email templates
- **File Handling**: Multer for file uploads with 50MB limit for programme files
- **API Design**: RESTful endpoints with proper error handling and validation

### Database Architecture
- **Primary Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM with schema-first approach
- **Connection**: Connection pooling with WebSocket support
- **Migrations**: Drizzle Kit for schema management

## Key Components

### AI Agent System
The platform features a sophisticated multi-agent architecture with five specialized agents:

1. **Email Intake Agent**: Processes incoming emails, classifies content, and extracts relevant data
2. **Contract Control Agent**: Monitors contract compliance, manages deadlines, and tracks NEC4 clause requirements
3. **Commercial Agent**: Handles cost analysis, equipment hire validation, and SCC compliance
4. **Operational Agent**: Manages programme data, critical path analysis, and milestone tracking
5. **Procurement Agent**: Monitors supplier performance and manages procurement workflows

### Core Modules

#### Project Management
- Project creation and management with NEC4 contract types
- Multi-user project access with role-based permissions
- Executive-level portfolio view for cross-project analytics

#### Document Processing
- AI-powered document analysis using OpenAI GPT-4o
- MS Project XML file parsing for programme import
- Automatic NEC4 compliance checking
- Multi-format file upload support (PDF, DOC, XLS, MPP, XML)

#### Contract Intelligence
- NEC4 knowledge base with clause-specific guidance
- Automated compensation event detection
- Early warning system with risk assessment
- Contract assistant for clause interpretation

#### Equipment Management
- Equipment categorization and tracking
- Hire/off-hire workflow automation
- Email-driven equipment requests
- Supplier performance monitoring

#### RFI Management
- Comprehensive RFI lifecycle management
- PDF report generation for client distribution
- Attachment handling and comment tracking
- Performance metrics and analytics

#### Procurement System
- Purchase order management with GPSMACS coding
- Supplier relationship management
- Inventory tracking with stock level monitoring
- Export capabilities for reporting

## Data Flow

### Email Processing Flow
1. Email received by intake agent
2. Content classified using AI pattern matching
3. Relevant data extracted and validated
4. Appropriate records created in database
5. Notifications sent to project team
6. Follow-up actions scheduled

### Document Analysis Flow
1. File uploaded through web interface
2. Content extracted and preprocessed
3. AI analysis for NEC4 compliance and issues
4. Results stored with recommendations
5. Integration with project records
6. Alert generation for critical findings

### Programme Management Flow
1. MS Project XML file imported
2. Activities and relationships parsed
3. Critical path analysis performed
4. Progress tracking initiated
5. Milestone monitoring activated
6. Variance alerts generated

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o model for document analysis and contract intelligence
- **Anthropic Claude**: Alternative AI provider for text analysis

### Communication Services
- **SendGrid**: Email service for notifications and confirmations
- **SMTP**: Direct email integration for intake processing

### File Processing
- **xml2js**: XML parsing for MS Project files
- **multer**: File upload handling
- **PDFKit**: PDF generation for reports
- **html2pdf**: HTML to PDF conversion

### Authentication & Security
- **Passport.js**: Authentication framework
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with TypeScript compilation
- **Development Server**: Vite dev server with HMR
- **Database**: Neon PostgreSQL with connection pooling
- **File Storage**: Local filesystem with organized directory structure

### Production Deployment
- **Platform**: Replit autoscale deployment
- **Build Process**: Vite build + ESBuild for server bundling
- **Port Configuration**: Port 5000 internal, Port 80 external
- **Environment Variables**: DATABASE_URL, OPENAI_API_KEY, SENDGRID_API_KEY

### Database Schema Management
- **Migrations**: Drizzle Kit with SQL migration files
- **Seeding**: Automated database seeding with sample data
- **Backup**: Neon built-in backup and recovery

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- June 13, 2025: Implemented comprehensive error handling and reliability improvements
  - Created advanced error handling middleware with detailed error classification and context
  - Implemented custom error classes: AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, DatabaseError, RateLimitError
  - Added sophisticated database error handling with retry logic and exponential backoff
  - Enhanced input sanitization using DOMPurify with recursive object cleaning
  - Implemented request logging middleware for comprehensive monitoring and debugging
  - Added project access validation helpers with role-based permissions
  - Created robust async error wrapper with request context tracking
  - Fixed critical TypeScript errors throughout storage and routing layers
  - Enhanced database connection stability with graceful WebSocket error handling

- June 13, 2025: Implemented enhanced rate limiting and sanitization using express-rate-limit and DOMPurify
  - Added express-rate-limit package for advanced rate limiting with specific limits per endpoint
  - Integrated isomorphic-dompurify for HTML sanitization of user text inputs
  - Created specific rate limiters: Compensation Events (10/15min), Early Warnings (15/15min), File Uploads (5/10min), Programme Analysis (20/10min)
  - Applied DOMPurify sanitization to all text fields including titles, descriptions, clause references, and mitigation plans
  - Enhanced security layer beyond existing comprehensive input validation system
  - Maintained existing multi-layer validation, SQL injection detection, XSS prevention, and file upload security

- June 13, 2025: Implemented enterprise-grade security and API protection
  - Fixed critical API key exposure vulnerabilities throughout the codebase
  - Created centralized API security management system with proper validation
  - Corrected Anthropic API configuration that was incorrectly using OpenAI keys
  - Implemented secure client initialization with API key format validation
  - Added rate limiting protection (60 requests/minute per client)
  - Enhanced email processing with secure AI client configuration
  - Eliminated all hardcoded API key usage across OpenAI and Anthropic integrations

- June 13, 2025: Implemented critical database performance optimizations
  - Enhanced connection pooling with max 20 connections, optimized timeouts (2s connection, 30s idle)
  - Added eager loading methods to eliminate N+1 query problems
  - Implemented batch user loading for compensation events and early warnings
  - Optimized database query patterns for better scalability
  - Enhanced production-ready architecture for enterprise performance

- June 13, 2025: Implemented comprehensive memory leak prevention system with optimized streaming
  - Replaced memory-intensive multer configurations with disk-based storage to prevent file upload memory leaks
  - Created StreamingFileProcessor class for handling large files with 16KB chunks and concurrent stream limiting
  - Added memory monitoring middleware to track and log significant memory usage increases (>10MB threshold)
  - Implemented automatic file cleanup middleware to prevent temporary file accumulation
  - Added periodic memory cleanup scheduling with manual garbage collection triggers
  - Enhanced error handling for memory-related issues (EMFILE, ENFILE, ENOSPC)
  - Created specialized upload configurations: documentUpload (10MB), programmeUpload (50MB), imageUpload (5MB)
  - Applied file filtering and security validation with automatic temp file cleanup
  - Integrated optimized streaming approach for MSP files with 16KB chunks and 100MB safety limits
  - Created dedicated StreamProcessor utility for reusable streaming across all file upload endpoints

- June 12, 2025: Implemented event-driven email processing architecture
  - Replaced simple email processing with AI-powered classification using Anthropic Claude
  - Added EventBus system for decoupled agent communication
  - Enhanced email intake with intelligent document type detection
  - Integrated agent event handlers for automated workflow processing
  - Updated frontend to display AI classification results with confidence scores

## Changelog

Changelog:
- June 12, 2025. Initial setup
- June 12, 2025. Event-driven architecture implementation
- June 13, 2025. Critical database performance optimizations