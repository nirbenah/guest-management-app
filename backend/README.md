# Guest Management App - Backend

REST API for event seating arrangement management built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (we recommend Supabase)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database connection string and other settings
```

3. Set up the database:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

4. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Health Check
- `GET /api/health` - Server health status

### Authentication (TODO)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Events (TODO)
- `GET /api/events` - Get user's events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Guests (TODO)
- `GET /api/events/:eventId/guests` - Get event guests
- `POST /api/events/:eventId/guests` - Add guest
- `GET /api/guests/:id` - Get guest details
- `PUT /api/guests/:id` - Update guest
- `DELETE /api/guests/:id` - Delete guest

## 🛠️ Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## 🏗️ Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Migration files
├── src/
│   ├── routes/              # API endpoints
│   ├── middleware/          # Express middleware
│   ├── services/            # Business logic
│   ├── repositories/        # Database access
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript types
│   └── server.ts           # Express app entry point
├── tests/                   # Test files (TODO)
├── .env                    # Environment variables
└── README.md               # This file
```

## 🗄️ Database Schema

The app uses PostgreSQL with Prisma ORM. Key entities:
- **User** - Authentication and ownership
- **Event** - Wedding, party, etc.
- **Guest** - People attending event
- **Table** - Physical tables in venue
- **Version** - Different seating arrangements
- **Group** - Guest organization (family, friends)
- **SeatingConstraint** - Must/must-not sit together rules

See `prisma/schema.prisma` for detailed schema.

## 🔐 Authentication

Uses JWT tokens for authentication. Include in requests as:
```
Authorization: Bearer <token>
```

## 🌍 Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS

## 📈 Next Steps

- [ ] Implement authentication endpoints
- [ ] Add event CRUD operations
- [ ] Add guest management
- [ ] Implement seating algorithm
- [ ] Add permission system
- [ ] Add API tests
- [ ] Add comprehensive error handling
- [ ] Add API documentation (OpenAPI/Swagger)

## 🤝 Contributing

This is a personal project but feedback is welcome!

---

**Last Updated:** 2025-11-08