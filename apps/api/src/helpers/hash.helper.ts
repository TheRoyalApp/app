import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
    try {
        const SALT_ROUNDS = 10;
        return await bcrypt.hash(password, SALT_ROUNDS);
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Failed to hash password');
    }
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
        const isPasswordValid = await bcrypt.compare(password, hashedPassword);
        return isPasswordValid;
    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
}