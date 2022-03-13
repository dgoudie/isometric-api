import jwt from 'jsonwebtoken';

export const getUserId = (req: Express.Request & { cookies: any }) => {
    let userId: string | undefined;
    if (process.env.NODE_ENV === 'development') {
        userId = process.env.USER_ID;
        if (!userId) {
            throw new Error('process.env.USER_ID not populated');
        }
    } else {
        const authToken = req.cookies.authorization;
        const token = jwt.decode(authToken);
        if (!token) {
            throw new Error('Invalid authorization cookie');
        }
        userId = token.sub as string;
    }
    return userId;
};
