# The Royal Barber API

A comprehensive API for The Royal Barber application, featuring user management, appointment booking, payment processing, and automated workflows.

## 🚀 Features

### Core Functionality
- **User Management**: Customer, staff, and admin roles with authentication
- **Service Management**: Service catalog with Stripe integration
- **Schedule Management**: Barber availability and time slot management
- **Appointment Booking**: Complete appointment lifecycle management
- **Payment Processing**: Stripe integration with automatic confirmation

### 🎯 Key Features
- ✅ **Automatic Appointment Confirmation**: Payments automatically create confirmed appointments
- ✅ **Real-time Availability**: Instant updates when appointments are booked
- ✅ **Stripe Integration**: Complete payment processing with webhooks
- ✅ **Role-based Access**: Secure access control for different user types
- ✅ **Reschedule Management**: Limited rescheduling with business rules

## 🛠️ Installation

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run start
```

## 🗄️ Database Setup

This project uses Drizzle ORM with PostgreSQL. Make sure you have a PostgreSQL database running and set the `DATABASE_URL` environment variable.

### Database Management Commands

- `bun run db:generate` - Generate migration files from schema changes
- `bun run db:migrate` - Run pending migrations
- `bun run db:push` - Push schema changes directly to database (for development)
- `bun run db:studio` - Open Drizzle Studio to view and edit data

### Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# JWT Authentication
JWT_SECRET=your-jwt-secret-key
REFRESH_SECRET=your-refresh-secret-key

# Stripe Integration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Internal API
INTERNAL_API_SECRET=your-internal-secret

# Environment
NODE_ENV=development
```

## 🔄 Payment Workflow

### Automatic Appointment Confirmation

When a customer completes payment through Stripe:

1. **Payment Completion**: Customer completes payment on Stripe checkout
2. **Webhook Processing**: System receives `checkout.session.completed` event
3. **Automatic Creation**: Appointment is created with "confirmed" status (not "pending")
4. **Real-time Updates**: Time slot is immediately marked as booked
5. **Payment Linking**: Payment is automatically linked to the appointment

### Benefits
- ✅ **Instant Confirmation**: No manual approval needed
- ✅ **Seamless Experience**: Customer gets immediate confirmation
- ✅ **Real-time Availability**: Slots are booked instantly
- ✅ **Complete Integration**: Payment and appointment are automatically linked

## 📚 API Documentation

- [Authentication](docs/auth.md) - User registration, login, and token management
- [Users](docs/users.md) - User management and role-based access
- [Services](docs/services.md) - Service catalog and pricing
- [Schedules](docs/schedules.md) - Barber availability and time slots
- [Appointments](docs/appointments.md) - Appointment booking and management
- [Payments](docs/payments.md) - Payment processing and Stripe integration

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
bun test

# Run specific test suites
bun run test:typescript
bun run test:production
bun run test:comprehensive

# Test payment workflow
bun run test:appointments
```

## 🔧 Development

This project was created using `bun init` in bun v1.2.13. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

### Development Commands
- `bun run dev` - Start development server with hot reload
- `bun run test` - Run test suite
- `bun run db:studio` - Open database management interface
