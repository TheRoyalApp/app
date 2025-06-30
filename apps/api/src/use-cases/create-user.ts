import { getDatabase } from "../db/connection";
import type { User } from "../users/users";
import type { UserResponse } from "../users/users.d";
import { hashPassword } from "../helpers/hash.helper";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

function validateUser(user: User): UserResponse {
    const res: UserResponse = {
        data: null,
        error: null,
    };

    if (!user.email || !user.password || !user.firstName || !user.lastName) {
        res.error = 'Missing required fields: email, password, firstName, and lastName are required';
        return res;
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(user.email)) {
        res.error = 'Invalid email format';
        return res;
    }

    const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!PASSWORD_REGEX.test(user.password)) {
        res.error = 'Password must be at least 8 characters long and contain at least one letter and one number';
        return res;
    }

    if (user.firstName.trim().length < 2 || user.firstName.trim().length > 50) {
        res.error = 'First name must be between 2 and 50 characters';
        return res;
    }

    if (user.lastName.trim().length < 2 || user.lastName.trim().length > 50) {
        res.error = 'Last name must be between 2 and 50 characters';
        return res;
    }

    res.data = user;
    return res;
}

export async function createUser(user: User): Promise<UserResponse> {
    const res: UserResponse = {
        data: null,
        error: null,
    };

    const db = await getDatabase();

    try {
        const validation = validateUser(user);

        if (validation.error) {
            res.error = validation.error;
            return res;
        }

        // Check if user with this email already exists
        const existingUser = await getUserByEmail(user.email.toLowerCase());

        if (existingUser.data) {
            res.error = 'User with this email already exists';
            return res;
        }

        // Hash password
        const hashedPassword = await hashPassword(user.password);

        // Generate a unique ID for the user
        const id = uuidv4();

        // Sanitize and prepare user data
        const sanitizedUser = {
            ...user,
            email: user.email.toLowerCase().trim(),
            firstName: user.firstName.trim(),
            lastName: user.lastName.trim(),
            phone: user.phone?.trim() || null,
            isAdmin: user.isAdmin || false,
            role: user.role || 'customer',
            password: hashedPassword,
            id,
        };

        // Insert the new user
        const [newUser] = await db.insert(users).values(sanitizedUser).returning();

        if (!newUser) {
            res.error = 'Failed to create user - database operation failed';
            return res;
        }

        // Return user without password for security
        const { password, ...userWithoutPassword } = newUser;
        res.data = userWithoutPassword as User;
        return res;
    } catch (error) {
        // Handle database-specific errors
        if (error instanceof Error) {
            if (error.message.includes('duplicate key')) {
                res.error = 'User with this email already exists';
                return res;
            }
            if (error.message.includes('violates not-null constraint')) {
                res.error = 'Missing required fields';
                return res;
            }
        }

        // Re-throw the error if it's already a custom error
        if (error instanceof Error && !error.message.includes('User with this email already exists')) {
            res.error = 'An unexpected error occurred while creating the user';
            return res;
        }

        // Generic error for unexpected issues
        res.error = 'An unexpected error occurred while creating the user';
        return res;
    }
}

export async function getUserByEmail(email: string): Promise<UserResponse> {
    const res: UserResponse = {
        data: null,
        error: null,
    };

    const db = await getDatabase();
    const user = await db.select().from(users).where(eq(users.email, email));
    const userData = user[0] as User;

    if (!userData) {
        res.error = 'User not found';
        return res;
    }

    res.data = userData;

    return res;
}