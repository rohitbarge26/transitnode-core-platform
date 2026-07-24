# TransitNode ERP - Core Platform

TransitNode ERP is an enterprise-grade, multi-tenant logistics and fleet management SaaS ecosystem engineered to centralize and automate end-to-end supply chain operations, vendor billing, fleet telemetry, and subscription management.

---

## 🏗 Architecture & Overview

This project is structured as a decoupled monorepo:

```text
transitnode-core-platform/
├── frontend/             # React 18 SPA (Dashboards, Master Admin, Portals)
├── backend/              # Node.js / Express multi-tenant API server
└── README.md
```

### 1. Frontend (`/frontend`)
Built with **React 18**, **React Router v6**, and **Tailwind CSS**. It features dynamic tenant branding skinning and sub-domain routing:
- **Master Admin Command Center** (`/master-admin`): Multi-tenant oversight, SaaS revenue telemetry, manual & automated tenant provisioning, and license suspension controls.
- **Admin Dashboard** (`/admin`): Fleet asset tracking, vendor rate cards management, driver assignment, compliance vault, and company workspace management.
- **Rate Card Configuration**: Multi-template pricing engine including *Route-Based (Point-to-Point)*, *Store Hub / Zone Matrix*, and *Fix Vehicle Rate*.
- **Receptionist & Operations**: Shipment intake forms, weight matrices, yard arrival logs, and daily run sheets.
- **Accountant**: Pending invoice queue, bank matching, and billing modifier tools.
- **Public Tracker**: Secure single-shipment tracking portal for clients.

### 2. Backend (`/backend`)
Built with **Node.js**, **Express**, **Mongoose (MongoDB)**, and **Socket.io**:
- **Multi-Tenant Isolation**: Tenant resolution via incoming `x-tenant-id` headers or custom subdomains with dynamic Mongoose data isolation plugins.
- **Dynamic Environment Selector (`env_selector`)**: Automatic environment key switching between `LOCALHOST`, `DEVELOPMENT`, and `PRODUCTION`.
- **Vendor Rate Card Management**: End-to-end multipart form processing for vendor rates (Toll, DCM Charges, Total) and file uploads (Vehicle RC & Driver License documents).
- **Master Key Security**: Header-based `x-master-admin-key` validation for administrative system actions.

---

## 🔑 Environment Configuration

The backend supports multi-environment configurations. Copy the example configuration to create your local `.env`:

```bash
cp backend/.env.example backend/.env
```

### Backend `.env` Matrix

```env
# Server Configuration
PORT=3000
NODE_ENV=localhost
FRONTEND_DOMAIN=transitnode.prohitcoretech.com

# Base Fallback Keys
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.s2xku84.mongodb.net/transitnode?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
MASTER_ADMIN_SECRET_KEY=your_master_admin_secret_key

# LOCALHOST CONFIGURATION
MONGO_URI_LOCALHOST=mongodb+srv://<user>:<password>@cluster0.s2xku84.mongodb.net/transitnode?retryWrites=true&w=majority
JWT_SECRET_LOCALHOST=your_jwt_secret_here
MASTER_ADMIN_SECRET_KEY_LOCALHOST=your_master_admin_secret_key

# DEVELOPMENT CONFIGURATION
MONGO_URI_DEVELOPMENT=mongodb+srv://<user>:<password>@cluster0.s2xku84.mongodb.net/transitnode-dev?retryWrites=true&w=majority
JWT_SECRET_DEVELOPMENT=your_jwt_secret_here
MASTER_ADMIN_SECRET_KEY_DEVELOPMENT=your_master_admin_secret_key

# PRODUCTION CONFIGURATION
MONGO_URI_PRODUCTION=mongodb+srv://<user>:<password>@cluster0.s2xku84.mongodb.net/transitnode-prod?retryWrites=true&w=majority
JWT_SECRET_PRODUCTION=your_jwt_secret_here
MASTER_ADMIN_SECRET_KEY_PRODUCTION=your_master_admin_secret_key
```

### Frontend `.env`

Create a `.env` file in `/frontend`:

```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_MASTER_KEY=your_master_admin_secret_key
```

---

## 🚀 Local Development Guide

### 1. Prerequisites
- **Node.js**: `v18+` (npm `v9+`)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI cluster.

### 2. Installation

Install node modules for both backend and frontend applications:

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Running Development Servers

Start the backend and frontend development processes:

```bash
# Terminal 1: Start Backend Server (Port 3000)
cd backend
npm start

# Terminal 2: Start Frontend App (Port 3001)
cd frontend
npm start
```

### 4. Accessing Portal Endpoints
- **Main App / Tenant Portal**: [http://localhost:3001](http://localhost:3001)
- **Master Admin Command Center**: [http://masteradmin.localhost:3001/master-admin](http://masteradmin.localhost:3001/master-admin) or [http://localhost:3001/master-admin](http://localhost:3001/master-admin)
- **Backend API**: [http://localhost:3000](http://localhost:3000)
