# 🏢 Tower Swing - West Coast Swing Dance Event

The highest West Coast Swing dance event in Helsinki! A full-stack web application for managing registrations, payments, and event information for the Tower Swing dance event held at Floor 33 of REDI Shopping Centre.

## ✨ Features

- **🎫 Online Registration** - Beautiful form with validation and email confirmations
- **📧 Email Automation** - Gmail SMTP for registration and payment confirmations
- **🔐 Admin Dashboard** - Secure login, registration management, payment tracking
- **📱 Responsive Design** - Works perfectly on all devices
- **🚪 Door Code Delivery** - Automatic door code in payment confirmation emails

## 🛠️ Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS  
**Backend:** Express.js, TypeScript, MongoDB Atlas, Nodemailer  
**Deployment:** Vercel (Frontend), Render (Backend), MongoDB Atlas (Database)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Gmail account with App Password

### Setup
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

## 📧 Email Setup

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate App Password** - Google Account → Security → App passwords
3. **Select "Mail"** and generate a 16-character password
4. **Update .env** with the App Password (remove spaces)

## 🚀 Deployment

### Frontend (Vercel)
- Connect GitHub repository to Vercel
- Set environment variables in Vercel dashboard
- Deploy automatically on push to main branch

### Backend (Render)
- Connect GitHub repository to Render
- Set environment variables in Render dashboard
- Configure build and start commands
- Deploy automatically on push to main branch

## 🐛 Troubleshooting

**Email not sending?** Check Gmail App Password  
**MongoDB connection issues?** Verify connection string and network access  
**Admin login fails?** Verify ADMIN_EMAIL and ADMIN_PASSWORD in .env  
**CORS errors?** Check CORS_ORIGIN configuration  

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details. **Note:** All images and visual assets are strictly prohibited from use without explicit permission.
