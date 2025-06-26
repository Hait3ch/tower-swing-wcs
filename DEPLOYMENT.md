# Tower Swing - Deployment Guide

## 🚀 **Production Deployment Checklist**

### **Phase 4 Complete: System Testing ✅**

All systems have been tested and are operational:
- ✅ Backend API (Port 5001)
- ✅ Frontend (Port 3000)
- ✅ Event System with Multi-Year Support
- ✅ Registration System with Waiting List
- ✅ Admin Dashboard
- ✅ Email Notifications
- ✅ Database Migration Complete

---

## **Backend Deployment (Render.com)**

### **1. Environment Variables**
Set these in your Render dashboard:

```env
PORT=5001
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tower-swing
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.com
ADMIN_EMAIL=admin@towerswing.com
ADMIN_PASSWORD=your-secure-admin-password
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
```

### **2. Build Settings**
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18.x or higher

### **3. Database Setup**
- MongoDB Atlas cluster configured
- Database: `tower-swing`
- Collections: `events`, `registrations`
- Migration script executed ✅

---

## **Frontend Deployment (Vercel)**

### **1. Environment Variables**
Set these in your Vercel dashboard:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.onrender.com
```

### **2. Build Settings**
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### **3. Domain Configuration**
- Configure custom domain in Vercel
- Update CORS_ORIGIN in backend to match

---

## **Pre-Deployment Checklist**

### **Backend**
- [ ] Environment variables configured
- [ ] MongoDB connection tested
- [ ] Admin credentials set
- [ ] Email service configured
- [ ] CORS origins updated
- [ ] Build successful locally

### **Frontend**
- [ ] API URL environment variable set
- [ ] Build successful locally
- [ ] Images optimized
- [ ] Favicon configured
- [ ] No console errors

### **Database**
- [ ] MongoDB Atlas cluster ready
- [ ] Network access configured
- [ ] Database user created
- [ ] Migration script ready

---

## **Post-Deployment Verification**

### **1. Backend Health Check**
```bash
curl https://your-backend-domain.onrender.com/health
```

### **2. Frontend Accessibility**
```bash
curl https://your-frontend-domain.com
```

### **3. API Endpoints Test**
```bash
# Test active event
curl https://your-backend-domain.onrender.com/api/events/active

# Test registration
curl -X POST https://your-backend-domain.onrender.com/api/registrations \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"+358401234567","experience":"beginner"}'
```

### **4. Admin Dashboard**
- [ ] Access admin login page
- [ ] Login with admin credentials
- [ ] View registrations
- [ ] Manage events
- [ ] View waiting list

---

## **Security Considerations**

### **Production Security**
- [ ] Strong JWT secret (32+ characters)
- [ ] Secure admin password
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation active
- [ ] Error messages sanitized

### **Environment Variables**
- [ ] Never commit .env files
- [ ] Use different secrets for dev/prod
- [ ] Rotate secrets regularly
- [ ] Monitor for exposure

---

## **Monitoring & Maintenance**

### **Health Monitoring**
- Set up uptime monitoring
- Monitor API response times
- Track registration metrics
- Monitor email delivery

### **Backup Strategy**
- MongoDB Atlas automatic backups
- Regular database exports
- Configuration backups
- Code repository backups

### **Updates & Maintenance**
- Regular dependency updates
- Security patches
- Performance monitoring
- User feedback collection

---

## **Troubleshooting**

### **Common Issues**

**Backend Won't Start**
- Check environment variables
- Verify MongoDB connection
- Check port availability
- Review build logs

**Frontend Build Fails**
- Check Node.js version
- Verify dependencies
- Check environment variables
- Review build logs

**Database Connection Issues**
- Verify MongoDB URI
- Check network access
- Verify credentials
- Check cluster status

**Email Not Sending**
- Verify Gmail credentials
- Check app password
- Verify email templates
- Check SMTP settings

---

## **Performance Optimization**

### **Backend**
- [ ] Database indexing optimized
- [ ] Query performance monitored
- [ ] Caching implemented
- [ ] Rate limiting configured

### **Frontend**
- [ ] Images optimized with sizes prop
- [ ] Code splitting implemented
- [ ] Bundle size optimized
- [ ] CDN configured

---

## **Support & Documentation**

### **User Documentation**
- Registration process
- Event information
- Contact details
- FAQ section

### **Admin Documentation**
- Dashboard usage
- Event management
- Registration management
- Waiting list management

---

## **Success Metrics**

### **Technical Metrics**
- [ ] 99.9% uptime
- [ ] <2s page load times
- [ ] <500ms API response times
- [ ] Zero security incidents

### **Business Metrics**
- [ ] Registration completion rate
- [ ] User satisfaction scores
- [ ] Event attendance tracking
- [ ] Admin efficiency metrics

---

**🎉 Ready for Production Deployment!**

The Tower Swing application is fully tested, optimized, and ready for production deployment. All systems are operational and the multi-year event management system is working perfectly. 