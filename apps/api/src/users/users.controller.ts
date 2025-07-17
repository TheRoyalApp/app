import { getDatabase, users } from '../db/connection.js';
import { eq, and } from 'drizzle-orm';
import { formatPhoneForTwilio } from '../helpers/phone.helper.js';
import winstonLogger from '../helpers/logger.js';
import type { User, UserResponse } from './users.d';


export async function getAllUsers(role?: 'customer' | 'staff'): Promise<UserResponse> {
    const res: UserResponse = {
        data: null,
        error: null,
    };

    try {
        const db = await getDatabase();
        
        // Build query with optional role filter
        let allUsers;
        if (role === 'staff') {
            // For staff role, exclude admin users (staff with isAdmin = true)
            allUsers = await db.select().from(users).where(
                and(
                    eq(users.role, role),
                    eq(users.isAdmin, false)
                )
            );
        } else if (role) {
            allUsers = await db.select().from(users).where(eq(users.role, role));
        } else {
            allUsers = await db.select().from(users);
        }
        
        if (allUsers.length === 0) {
            if (role === 'staff') {
                res.error = 'No hay barberos registrados en el sistema';
            } else if (role) {
                res.error = `No se encontraron usuarios con rol '${role}'`;
            } else {
                res.error = 'No se encontraron usuarios';
            }
            return res;
        }
        
        res.data = allUsers as User[];
        return res;
    } catch (error) {
        console.error('Error fetching users:', error);
        
        // Handle specific database errors
        if (error instanceof Error) {
            if (error.message.includes('column') && error.message.includes('does not exist')) {
                res.error = 'Error de configuración de base de datos. Contacta al administrador.';
                return res;
            } else if (error.message.includes('connection') || error.message.includes('timeout')) {
                res.error = 'Error de conexión a la base de datos. Intenta más tarde.';
                return res;
            } else if (error.message.includes('permission') || error.message.includes('access')) {
                res.error = 'Error de acceso a la base de datos. Contacta al administrador.';
                return res;
            }
        }
        
        // Generic error message to prevent exposing internal details
        res.error = 'Error interno del servidor al obtener usuarios';
        return res;
    }
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

        // Format phone number if it's being updated
        let formattedUpdateData = { ...updateData };
        if (updateData.phone) {
            const phoneResult = formatPhoneForTwilio(updateData.phone);
            if (!phoneResult.isValid) {
                winstonLogger.warn('Invalid phone number during user update', { 
                    userId: id,
                    phone: updateData.phone, 
                    error: phoneResult.error 
                });
                res.error = phoneResult.error || 'Invalid phone number format';
                return res;
            }
            formattedUpdateData.phone = phoneResult.formatted;
        }

        // Remove sensitive fields that shouldn't be updated directly
        const { password, refreshToken, ...safeUpdateData } = formattedUpdateData;

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
        
        // Handle specific database errors
        if (error instanceof Error) {
            if (error.message.includes('column') && error.message.includes('does not exist')) {
                res.error = 'Error de configuración de base de datos. Contacta al administrador.';
                return res;
            } else if (error.message.includes('connection') || error.message.includes('timeout')) {
                res.error = 'Error de conexión a la base de datos. Intenta más tarde.';
                return res;
            } else if (error.message.includes('permission') || error.message.includes('access')) {
                res.error = 'Error de acceso a la base de datos. Contacta al administrador.';
                return res;
            }
        }
        
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
        
        // Handle specific database errors
        if (error instanceof Error) {
            if (error.message.includes('column') && error.message.includes('does not exist')) {
                res.error = 'Error de configuración de base de datos. Contacta al administrador.';
                return res;
            } else if (error.message.includes('connection') || error.message.includes('timeout')) {
                res.error = 'Error de conexión a la base de datos. Intenta más tarde.';
                return res;
            } else if (error.message.includes('permission') || error.message.includes('access')) {
                res.error = 'Error de acceso a la base de datos. Contacta al administrador.';
                return res;
            }
        }
        
        res.error = 'Failed to delete user';
        return res;
    }
}

export async function searchUserByEmail(email: string): Promise<UserResponse> {
    const res: UserResponse = {
        data: null,
        error: null,
    };

    try {
        const db = await getDatabase();
        
        // Convert email to lowercase for case-insensitive search
        const normalizedEmail = email.toLowerCase().trim();
        
        const user = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
        
        if (!user[0]) {
            res.error = 'User not found';
            return res;
        }

        res.data = user[0] as User;
        return res;
    } catch (error) {
        console.error('Error searching user by email:', error);
        res.error = 'Failed to search user';
        return res;
    }
}

export async function updateUserRole(id: string, role: 'customer' | 'staff' | 'admin'): Promise<UserResponse> {
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

        // Update role and isAdmin flag
        const updateData: any = {
            updatedAt: new Date()
        };

        // Handle admin role specially - set isAdmin flag and keep role as 'staff'
        if (role === 'admin') {
            updateData.isAdmin = true;
            updateData.role = 'staff'; // Admin users have staff role with isAdmin=true
        } else {
            updateData.isAdmin = false;
            updateData.role = role; // customer or staff
        }

        const [updatedUser] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, id))
            .returning();

        res.data = updatedUser as User;
        return res;
    } catch (error) {
        console.error('Error updating user role:', error);
        res.error = 'Failed to update user role';
        return res;
    }
}