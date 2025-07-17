# Database Seeding Commands

This document describes the database seeding commands available in The Royal Barber project.

## Overview

The seeding commands populate the database with initial data required for the application to function properly. These commands should be run after setting up the database and running migrations.

## Available Commands

### `seed:all`

**Command:** `pnpm seed:all`

**Description:** Runs all seeding scripts in the correct order to populate the database with complete initial data.

**What it does:**
1. Seeds users (barbers and admin accounts)
2. Seeds services (haircut and grooming services)
3. Seeds schedules (availability for all barbers)

**Usage:**
```bash
pnpm seed:all
```

### Individual Seed Commands

#### `seed:users`

**Command:** `pnpm seed:users`

**Description:** Creates initial user accounts including barbers and admin users.

**Creates:**
- **Barber Account:**
  - Email: `barber@theroyalbarber.com`
  - Password: `BarberPass123`
  - Name: Carlos Rodriguez
  - Role: staff
  - Phone: +1234567890

- **Admin Account:**
  - Email: `admin@theroyalbarber.com`
  - Password: `AdminPass123`
  - Name: Admin Manager
  - Role: staff (with admin privileges)
  - Phone: +1234567891

- **Staff Account:**
  - Email: `staff@example.com`
  - Password: `StaffPass123`
  - Name: Staff User
  - Role: staff
  - Phone: +1234567892

#### `seed:services`

**Command:** `pnpm seed:services`

**Description:** Creates default barber services with pricing and duration.

**Creates:**
- **Classic Haircut** - $25.00 (30 minutes)
- **Premium Haircut** - $35.00 (45 minutes)
- **Beard Trim** - $15.00 (20 minutes)
- **Haircut + Beard** - $40.00 (50 minutes)
- **Kids Haircut** - $20.00 (25 minutes)

#### `seed:schedules`

**Command:** `pnpm seed:schedules`

**Description:** Creates availability schedules for all barbers.

**Creates schedules for:**
- **Weekdays (Monday-Friday):** 9:00 AM - 7:30 PM (30-minute slots)
- **Weekends (Saturday-Sunday):** 10:00 AM - 5:30 PM (30-minute slots)

**Prerequisites:** Must run `seed:users` first to create barber accounts.

## Execution Order

The `seed:all` command executes the scripts in this specific order:

1. **Users** → Creates barber and admin accounts
2. **Services** → Creates available services
3. **Schedules** → Creates availability for all barbers

This order is important because:
- Schedules depend on barber users existing in the database
- Services are independent but needed for appointments
- Users must exist before creating their schedules

## Prerequisites

Before running any seed commands, ensure:

1. Database is set up and running
2. Migrations have been applied: `pnpm db:setup`
3. Environment variables are configured
4. Database connection is working

## Troubleshooting

### Common Issues

**"No barbers found" error when running `seed:schedules`:**
- Solution: Run `seed:users` first to create barber accounts

**Database connection errors:**
- Verify database is running
- Check environment variables
- Ensure migrations are applied

**Duplicate entry errors:**
- The seeding scripts are designed to be idempotent
- If you need to reset data, clear the database first

### Reset and Reseed

To completely reset and reseed the database:

```bash
# 1. Reset database (if needed)
pnpm db:setup:force

# 2. Run all seeds
pnpm seed:all
```

## Development Notes

- All seed scripts use `process.exit(0)` to terminate cleanly
- Error handling is implemented for each seeding operation
- Console output provides feedback on success/failure
- Scripts are designed to be run multiple times safely

## Production Considerations

- Change default passwords in production
- Update contact information for real barbers
- Adjust service prices as needed
- Modify schedules based on actual business hours
- Consider using environment variables for sensitive data 