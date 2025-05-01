require('dotenv').config()
import { Request, Response, NextFunction } from 'express';
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const jwt = require('jsonwebtoken')

interface AuthRequest extends Request {
    id?: string;
}
const authMiddlewear = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeade = req.headers.authorization;
    if (!authHeade) {
        res.status(403).json({
            message: "No header"
        })
        return;
    }
    const token = req.headers.authorization?.split(' ')[1]
    // console.log(token)
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        if (decoded.id) {
            req.id = decoded.id;
        }
        next();

    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
        return;

    }

}
export default authMiddlewear;