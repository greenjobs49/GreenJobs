# JobPortal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Frontend: React](https://img.shields.io/badge/Frontend-React-61DAFB.svg)](https://reactjs.org)
[![Backend: Node.js](https://img.shields.io/badge/Backend-Node.js-339933.svg)](https://nodejs.org)
[![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248.svg)](https://mongodb.com)

A **production-ready job portal** connecting **job seekers**, **recruiters**, and **business owners** with a modern UI, infinite scroll, and complete hiring workflow.

## **Key Features**

### **Job Seekers**
- **Infinite scroll job listings** with real-time filtering (location, type, pay, skills)
- **Detailed job pages** showing full hiring process (interview rounds)
- **One-click applications** with cover letter support
- **Responsive design** - Mobile-first experience
- **Verified employers** badge system

### **Recruiters**
- **Post jobs** linked to approved businesses
- **Multi-stage hiring process** (resume → technical → HR → offer)
- **Edit & take down** live jobs
- **Business approval workflow**

### **Business Owners**
- **Review & approve** recruiter job posts
- **Reject unwanted listings**
- **Pending job dashboard**

### **Technical Highlights**
- **Client-side filtering** - Instant search without API calls
- **Infinite scroll** - IntersectionObserver API
- **Public APIs** - No-auth job browsing
- **Role-based routes** - Recruiter vs Public separation
- **Production-grade error handling**

## **Tech Stack**

| **Frontend** | **Backend** | **Database** | **Other** |
|--------------|-------------|--------------|-----------|
| React 18+ | Node.js + Express | MongoDB + Mongoose | JWT Auth |
| React Router | Axios | TailwindCSS (inline) | React Hot Toast |
| Lucide React Icons | CORS | Lucide Icons | Vite |
| React Hot Toast | Helmet |  |  |