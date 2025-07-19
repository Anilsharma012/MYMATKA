import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

interface AdminRequest extends Request {
  user?: IUser;
  admin?: IUser;
}

const adminAuth = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "Access denied. No token provided." });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET || "matka-hub-secret-key-2024";
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      res.status(401).json({ message: "Invalid token. User not found." });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ message: "Account is deactivated." });
      return;
    }

    if (user.role !== "admin" && user.role !== "superadmin") {
      res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
      return;
    }

    req.admin = user;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token." });
  }
};

const superAdminAuth = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "Access denied. No token provided." });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET || "matka-hub-secret-key-2024";
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      res.status(401).json({ message: "Invalid token. User not found." });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ message: "Account is deactivated." });
      return;
    }

    if (user.role !== "superadmin") {
      res.status(403).json({
        message: "Access denied. Super admin privileges required.",
      });
      return;
    }

    req.admin = user;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token." });
  }
};

export { adminAuth, superAdminAuth };
export type { AdminRequest };
