# Intervue - Real-Time Live Polling System

A real-time interactive polling application that enables teachers to create and manage live polls with instant results, while students can participate and vote in real-time. Built with WebSocket technology for seamless bidirectional communication.

## Live Demo & Repository

- **Live Demo**: https://poll.jxngrx.in
- **Repository**: https://github.com/jxngrx/intervue-assignment

## Problem Statement

This project addresses the need for an interactive, real-time polling system for educational or presentation scenarios where:

- A teacher/presenter needs to engage an audience with live questions
- Students/participants need to respond in real-time with immediate feedback
- Results should be visible instantly to both teachers and students
- The system must handle multiple concurrent users without performance degradation
- State synchronization is critical when users join mid-session or refresh their browsers

**Why this approach was chosen:**

Real-time polling requires instant updates across all connected clients. Traditional REST APIs with polling would create unnecessary server load and latency. WebSocket (Socket.io) was chosen because it enables:
- Instant bidirectional communication
- Efficient state synchronization
- Automatic reconnection handling
- Lower latency compared to HTTP polling
- Better user experience with live updates

## Features Implemented

### Core Features

- **Role-Based Access**: Separate interfaces for teachers and students with protected routes
- **Real-Time Poll Creation**: Teachers can create polls with custom questions, 2-10 options, and configurable duration (15-120 seconds)
- **Live Voting**: Students can vote on active polls with real-time vote count updates
- **Instant Results**: Results are displayed in real-time as votes come in, with visual percentage bars
- **Timer Management**: Countdown timer for each poll that continues running even after students submit votes
- **Auto-Completion**: Polls automatically complete when all connected students have voted or when the timer expires
- **Poll History**: Teachers can view all completed polls with their results
- **Session Management**:
  - Only one teacher can be active at a time
  - Teacher logout ends the session and disconnects all students
  - Automatic session cleanup on teacher disconnect

### Edge Cases Handled

- **Duplicate Student Names**: Students with the same name are automatically numbered (e.g., "John", "John #2")
- **Late-Joining Students**: Students who join mid-poll see the correct remaining time
- **Page Refresh**: State is preserved and synchronized on refresh for both teachers and students
- **Tab Switching**: Participant counts and state remain synchronized when teachers switch tabs
- **Network Reconnection**: Automatic reconnection with state recovery
- **Poll Cancellation**: Teachers can cancel polls, preventing further voting while preserving vote history
- **Multiple Polls**: Sequential poll creation with proper question numbering
- **Vote Validation**: Prevents duplicate votes, voting on inactive polls, and voting after expiration
- **Timer Persistence**: Timer continues running even after a student votes, showing accurate remaining time

### Additional Features

- **Chat System**: Real-time chat between students and teachers
- **Participant Management**: Teachers can view connected participants and kick out students
- **Question Numbering**: Automatic tracking of poll sequence (Question 1, Question 2, etc.)
- **Dynamic UI**: Single unified view for students that adapts based on poll state (waiting, voting, results)
- **Toast Notifications**: User-friendly feedback for all actions
- **Connection Status Indicator**: Visual indicator of WebSocket connection status

## Tech Stack

### Frontend

- **React 19.2** - UI framework
- **TypeScript** - Type safety
- **Vite 7.2** - Build tool and dev server
- **React Router DOM 6.20** - Client-side routing
- **Socket.io Client 4.6** - WebSocket communication
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **PM2** - Process manager for production

### Backend

- **Node.js 20** - Runtime environment
- **Express 4.18** - Web framework
- **TypeScript 5.3** - Type safety
- **Socket.io 4.6** - WebSocket server
- **Mongoose 9.1** - MongoDB ODM
- **PM2** - Process manager for production

### Database

- **MongoDB 7** - NoSQL database for polls and votes

### Deployment / Hosting

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **PM2** - Process management in containers

## High-Level Architecture / Flow

### Data Flow

1. **Initial Connection**:
   - User selects role (teacher/student) on landing page
   - WebSocket connection established
   - Role-specific state synchronized

2. **Teacher Flow**:
   - Teacher creates a poll (question, options, duration) → Saved to MongoDB
   - Poll created in "pending" status → Broadcasted to all clients via Socket.io
   - Teacher activates poll → Status changes to "active", timer starts
   - Votes received → Real-time vote counts broadcasted to all clients
   - Poll completes (all voted or timer expires) → Status changes to "completed", results displayed

3. **Student Flow**:
   - Student enters name and joins → Added to participants list
   - Active poll displayed → Student can vote
   - Vote submitted → Saved to MongoDB, vote counts updated in real-time
   - Results displayed → After voting or poll completion

4. **Real-Time Synchronization**:
   - All state changes broadcasted via Socket.io events
   - Clients maintain local state but sync with server on events
   - State recovery on reconnection via `state:request` events

### Component Structure

```
Frontend:
├── Pages (RoleSelection, TeacherCreatePoll, TeacherLiveResults, StudentView, etc.)
├── Context (UserContext, PollContext) - Global state management
├── Hooks (useSocket, usePollState, usePollTimer) - Custom business logic
├── Components (PollCard, Timer, PollResults, ChatModal) - Reusable UI
└── Services (api.ts, socket.ts) - API and WebSocket clients

Backend:
├── Routes (pollRoutes, voteRoutes, stateRoutes) - REST API endpoints
├── Socket Handlers (pollSocketHandler) - WebSocket event handlers
├── Services (PollService, VoteService, TimerService) - Business logic
├── Models (Poll, Vote) - Database schemas
└── Controllers - Request handlers
```

## Setup & Installation

### Prerequisites

- Node.js 20+ and Yarn
- Docker and Docker Compose (for containerized deployment)
- MongoDB 7 (or use Docker Compose to run it)

### Step-by-Step Local Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd intervue
   ```

2. **Backend Setup**
   ```bash
   cd backend
   yarn install
   # Create .env file (optional, defaults provided)
   yarn dev  # Runs on http://localhost:3005
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   yarn install
   yarn dev  # Runs on http://localhost:5173
   ```

4. **Docker Setup (Recommended)**
   ```bash
   # From project root
   docker compose up --build
   ```
   This starts:
   - Backend on port 3005
   - Frontend on port 5173
   - MongoDB on port 27017

### Environment Variables

#### Backend (`.env` in `backend/` directory)

- `PORT` (default: `3005`) - Backend server port
- `MONGODB_URI` (default: `mongodb://localhost:27017/polling-system`) - MongoDB connection string
- `CORS_ORIGIN` (optional) - Comma-separated list of allowed origins for CORS
- `NODE_ENV` (optional) - Environment mode (development/production)

#### Frontend (Build-time variables, prefixed with `VITE_`)

- `VITE_API_BASE_URL` (optional) - Backend API URL (defaults to auto-detection based on hostname)
- `VITE_SOCKET_URL` (optional) - WebSocket server URL (defaults to API_BASE_URL)

**Note**: Frontend environment variables must be set at build time. For Docker, use build args in `docker-compose.yml`.

## Key Design Decisions

### State Management

- **Context API**: Used for global state (user role, poll data) instead of Redux to keep the stack lightweight
- **Local State**: Component-level state for UI-specific data (form inputs, toasts)
- **Socket.io Events**: Primary mechanism for real-time state synchronization

### API Design

- **REST + WebSocket Hybrid**:
  - REST API for initial data fetching and state recovery
  - WebSocket for all real-time updates
- **State Recovery**: `state:request` event allows clients to recover full state after reconnection

### Frontend Architecture

- **Unified Student View**: Single component (`StudentView`) that conditionally renders based on poll state, eliminating the need for multiple routes and reducing complexity
- **Custom Hooks**: Business logic extracted into reusable hooks (`usePollTimer`, `usePollState`) for better testability and separation of concerns
- **Protected Routes**: Route-level authentication using React Router and Context API

### Backend Architecture

- **Service Layer Pattern**: Business logic separated into service classes (PollService, VoteService, TimerService) for better organization and testability
- **Socket Handler Separation**: Poll-related socket events handled in dedicated file for maintainability
- **In-Memory State**: Connected students and active teacher tracked in memory for fast lookups, with MongoDB as source of truth

### Database Design

- **Poll Document**: Embedded options array with vote counts for efficient reads
- **Vote Document**: Separate collection with unique constraint on (pollId, studentId) to prevent duplicate votes
- **Indexes**: Strategic indexes on status and createdAt for faster queries

### Timer Implementation

- **Server-Side Timer**: Timer state calculated server-side and broadcasted every second to ensure consistency
- **Client-Side Display**: Client receives timer updates and displays them, but server is source of truth
- **Auto-Expiration**: Background job checks for expired polls every 5 seconds

## Assumptions & Limitations

### Assumptions

- **Single Active Teacher**: Only one teacher can be active per session (by design)
- **Session-Based**: No persistent user authentication - sessions are temporary and cleared on logout
- **Student Identification**: Students identified by auto-generated IDs, not persistent accounts
- **Network Stability**: Assumes relatively stable network connections (reconnection handled but not optimized for frequent disconnects)

### Known Limitations

- **No Authentication**: No login system - anyone can join as teacher or student
- **No Persistent User Accounts**: Student names and IDs are session-based only
- **Single Teacher Constraint**: Only one teacher can be active at a time (prevents multiple teachers from conflicting)
- **No Poll Editing**: Once created, polls cannot be edited, only cancelled
- **No Vote Modification**: Students cannot change their votes after submission
- **Browser Tab Limitation**: Each browser tab is treated as a separate connection (by design for testing)
- **No Data Persistence Across Sessions**: Poll history persists in database, but user sessions are ephemeral
- **CORS Configuration**: Requires manual CORS configuration for new domains

## Future Improvements

If given more time, I would implement:

1. **User Authentication & Authorization**
   - JWT-based authentication for teachers
   - Student accounts or guest mode with better identification
   - Role-based access control with proper session management

2. **Enhanced Poll Features**
   - Poll templates for common question types
   - Poll editing before activation
   - Multiple choice vs. single choice options
   - Poll scheduling and recurring polls

3. **Analytics & Reporting**
   - Detailed analytics dashboard for teachers
   - Export poll results to CSV/PDF
   - Participation statistics and trends
   - Individual student performance tracking

4. **Improved UX**
   - Dark mode toggle
   - Responsive design optimizations for mobile devices
   - Accessibility improvements (ARIA labels, keyboard navigation)
   - Loading skeletons instead of spinners

5. **Scalability Enhancements**
   - Redis for session management and caching
   - Horizontal scaling with Socket.io adapter (Redis adapter)
   - Rate limiting and DDoS protection
   - Database connection pooling optimization

## AI Usage Declaration

**No AI tools were used for code generation.** This project was built using standard development tools and practices:

- **Code Editor**: VS Code with TypeScript and ESLint extensions
- **Version Control**: Git for source control
- **Documentation**: Manual documentation based on actual implementation
- **Debugging**: Browser DevTools and Node.js debugging tools
- **Code Quality**: ESLint for linting, TypeScript compiler for type checking

All code, architecture decisions, and implementations were created through traditional software development practices, research of official documentation, and iterative problem-solving.
