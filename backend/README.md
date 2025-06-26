# Tower Swing Backend API

Backend API for the Tower Swing dance event website built with Express.js, TypeScript, and MongoDB.

## Features

- **Authentication**: JWT-based admin authentication
- **Registration Management**: CRUD operations for event registrations
- **Admin Dashboard**: Statistics and registration overview
- **MongoDB Integration**: Mongoose ODM with TypeScript
- **RESTful API**: Clean and documented endpoints
- **Error Handling**: Comprehensive error handling and validation

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Mongoose schema validation
- **CORS**: Cross-origin resource sharing support

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn package manager

## Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tower-swing
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3000
   ADMIN_EMAIL=your-admin-email@example.com
   ADMIN_PASSWORD=your-secure-admin-password
   ```

## Development

**Start development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Start production server:**
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/verify` - Verify JWT token

### Registrations
- `POST /api/registrations` - Create new registration
- `GET /api/registrations` - Get all registrations (admin only)
- `GET /api/registrations/:id` - Get registration by ID (admin only)
- `PATCH /api/registrations/:id/status` - Update payment status (admin only)
- `DELETE /api/registrations/:id` - Delete registration (admin only)
- `GET /api/registrations/stats/overview` - Get registration statistics (admin only)

### Health Check
- `GET /health` - Server health status

## Database Schema

### Registration Model
```typescript
{
  firstName: string,
  lastName: string,
  email: string (unique),
  phone: string,
  experience: 'beginner' | 'intermediate' | 'advanced',
  dietaryRestrictions?: string,
  emergencyContact: {
    name: string,
    phone: string,
    relationship: string
  },
  paymentStatus: 'pending' | 'paid' | 'cancelled',
  registrationDate: Date,
  eventDate: Date,
  price: number,
  notes?: string
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5001 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |
| `ADMIN_EMAIL` | Admin email for login | Required |
| `ADMIN_PASSWORD` | Admin password | Required |

## Deployment

### Render.com
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables in Render dashboard

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`

## Security Considerations

- JWT tokens are used for authentication
- Admin credentials must be set via environment variables
- Passwords should be hashed in production
- CORS is configured for specific origins
- Input validation is implemented
- Rate limiting should be added for production
- Never commit sensitive credentials to version control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 