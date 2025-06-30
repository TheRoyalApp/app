import { getDatabase, users } from '../db/connection.js';
import { eq } from 'drizzle-orm';
import type { User, UserResponse } from './users.d';


export async function getAllUsers(): Promise<UserResponse> {
    const res: UserResponse = {
        data: null,
        error: null,
    };

    const db = await getDatabase();
    const allUsers = await db.select().from(users);
    res.data = allUsers as User[];

    return res;
}

export async function getUserById(id: string): Promise<UserResponse> {
    const res: UserResponse = {
        data: [],
        error: null,
    };

    const db = await getDatabase();
    const user = await db.select().from(users).where(eq(users.id, id));
    const userData = user[0] as User;

    if (!userData) {
        res.error = 'User not found';
        return res;
    }

    res.data = userData;
    return res;
}

export async function updateUser(id: string, updateData: Partial<User>): Promise<UserResponse> {
    const res: UserResponse = {
        data: null,
        error: null,
    };

    try {
        const db = await getDatabase();
        
        // Check if user exists
        const existingUser = await db.select().from(users).where(eq(users.id, id));
        if (!existingUser[0]) {
            res.error = 'User not found';
            return res;
        }

        // Remove sensitive fields that shouldn't be updated directly
        const { password, refreshToken, ...safeUpdateData } = updateData;

        const [updatedUser] = await db
            .update(users)
            .set({
                ...safeUpdateData,
                updatedAt: new Date()
            })
            .where(eq(users.id, id))
            .returning();

        res.data = updatedUser as User;
        return res;
    } catch (error) {
        console.error('Error updating user:', error);
        res.error = 'Failed to update user';
        return res;
    }
}

export async function deleteUser(id: string): Promise<UserResponse> {
    const res: UserResponse = {
        data: null,
        error: null,
    };

    try {
        const db = await getDatabase();
        
        // Check if user exists
        const existingUser = await db.select().from(users).where(eq(users.id, id));
        if (!existingUser[0]) {
            res.error = 'User not found';
            return res;
        }

        await db.delete(users).where(eq(users.id, id));
        
        res.data = existingUser[0] as User; // Return the deleted user data
        return res;
    } catch (error) {
        console.error('Error deleting user:', error);
        res.error = 'Failed to delete user';
        return res;
    }
}