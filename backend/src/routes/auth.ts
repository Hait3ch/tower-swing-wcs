import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';

const router = Router();

interface LoginRequest {
  email: string;
  password: string;
}

interface AdminJwtPayload {
  email: string;
  role: 'admin';
  id: string;
}

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Check admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL as string;
    const adminPassword = process.env.ADMIN_PASSWORD as string;

    if (!adminEmail || !adminPassword) {
      console.error('Admin credentials not configured in environment variables');
      res.status(500).json({ message: 'Server configuration error' });
      return;
    }

    if (email !== adminEmail) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // In production, you would hash the stored password and compare
    // For now, we'll do a simple comparison
    if (password !== adminPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET as string;
    if (!secret) {
      res.status(500).json({ message: 'Server configuration error' });
      return;
    }

    const expiresIn: string = (process.env.JWT_EXPIRES_IN as string) || '7d';
    const payload: AdminJwtPayload = {
      email,
      role: 'admin',
      id: 'admin-user'
    };

    const token = jwt.sign(
      payload,
      secret,
      { expiresIn } as any
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        email,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Token required' });
      return;
    }

    const secret = process.env.JWT_SECRET as string;
    if (!secret) {
      res.status(500).json({ message: 'Server configuration error' });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    res.json({
      valid: true,
      user: {
        email: decoded.email,
        role: decoded.role
      }
    });

  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router; 