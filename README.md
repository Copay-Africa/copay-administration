This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

# Copay Super Admin Portal

A comprehensive dashboard for platform administrators to manage cooperatives, monitor payments, approve onboardings, and handle system configurations. Built with Next.js 16 (App Router), TypeScript, and shadcn/ui components.

## 🚀 Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Protected routes with role-based access
- Secure cookie-based token storage
- Super Admin role verification

### 📊 Dashboard & Analytics
- Real-time platform statistics
- Revenue monitoring and growth metrics
- Active user and organization tracking
- System health monitoring
- Quick action shortcuts

### 🏢 Organization Management
- Complete cooperative profiles
- Subscription plan management
- Member count tracking
- Revenue analytics per organization
- Status management (Active, Suspended, Pending)

### 💳 Payment Monitoring
- Real-time payment transaction tracking
- Payment status monitoring (Paid, Pending, Failed)
- Payment method analytics
- Revenue reporting and exports
- Success rate calculations

### 📋 Onboarding Requests
- New cooperative registration reviews
- Document verification system
- Approval/rejection workflows
- Status tracking and notes
- Business type categorization

### 👥 User Management
- Super admin user accounts
- Role-based permissions
- Activity tracking
- Account status management

### 🔧 System Configuration
- Platform settings management
- Announcement system
- System configuration controls
- Audit trails

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Authentication**: JWT with js-cookie
- **Date Handling**: date-fns
- **State Management**: React Context + Hooks

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd copay-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update the `.env.local` file with your configuration:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
   NEXT_PUBLIC_APP_NAME=Copay Super Admin
   NODE_ENV=development
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 Authentication

### Login Credentials Format
The system expects login credentials in the following format:

```typescript
{
  "phone": "+250788000001",
  "pin": "1234"
}
```

### API Endpoint
```
POST http://localhost:3000/api/v1/auth/login
```

## 🏗 Project Structure

```
copay-admin/
├── app/                          # Next.js 16 App Router
│   ├── dashboard/               # Dashboard page
│   ├── login/                   # Authentication
│   ├── organizations/           # Organization management
│   ├── payments/               # Payment monitoring
│   ├── requests/               # Onboarding requests
│   ├── announcements/          # System announcements
│   ├── users/                  # User management
│   ├── settings/               # System settings
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page (redirects)
├── components/                  # Reusable components
│   ├── ui/                     # shadcn/ui components
│   └── layout/                 # Layout components
├── context/                    # React Context providers
│   └── auth-context.tsx        # Authentication context
├── lib/                        # Utility functions
│   ├── api-client.ts          # API client with interceptors
│   └── utils.ts               # Helper utilities
├── types/                      # TypeScript type definitions
│   └── index.ts               # All type definitions
└── public/                     # Static assets
```

## 🎨 Design System

### Color Palette
- **Primary Navy**: `hsl(221.2 83.2% 53.3%)` - Bold navy for primary actions
- **Secondary Blue**: `hsl(213 93% 68%)` - Soft blue highlights
- **Light Blue**: `hsl(213 93% 95%)` - Background accents
- **Gray**: `hsl(215.4 16.3% 46.9%)` - Secondary text
- **Light Gray**: `hsl(210 40% 96%)` - Subtle backgrounds

### Typography
- **Font Family**: Geist Sans (primary), Geist Mono (code)
- **Headings**: Bold navy (`text-copay-navy`)
- **Body**: Standard gray (`text-copay-gray`)
- **Interactive**: Blue highlights (`text-copay-blue`)

### Components
All components follow the shadcn/ui design system with Copay specific theming:
- **Buttons**: Navy primary, outline variants
- **Cards**: Clean white surfaces with subtle shadows
- **Tables**: Responsive with hover states
- **Badges**: Status-specific colors
- **Forms**: Focus ring styling with navy accents

## 🔧 API Integration

### Base Configuration
The API client is configured in `/lib/api-client.ts` with:
- Automatic token injection
- Token refresh handling
- Error interceptors
- Request/response logging

### Available Methods
```typescript
// Authentication
apiClient.login(credentials)
apiClient.logout()
apiClient.getCurrentUser()

// Organizations
apiClient.organizations.getAll(filters)
apiClient.organizations.getById(id)
apiClient.organizations.approve(id)

// Payments
apiClient.payments.getAll(filters)
apiClient.payments.getById(id)

// And many more...
```

### Type Safety
All API responses are fully typed with TypeScript interfaces defined in `/types/index.ts`.

## 🔐 Authentication Flow

1. **Login**: User enters phone and PIN
2. **Token Storage**: JWT tokens stored in secure httpOnly cookies
3. **Route Protection**: `withAuth` HOC protects dashboard routes
4. **Token Refresh**: Automatic refresh on 401 responses
5. **Logout**: Clear tokens and redirect to login

## 📱 Responsive Design

The portal is fully responsive with:
- **Mobile-first design** approach
- **Collapsible sidebar** on mobile devices
- **Touch-friendly** interactions
- **Adaptive layouts** for all screen sizes
- **Accessible navigation** patterns

## 🚀 Development

### Available Scripts
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
```

### Code Quality
- **ESLint**: Enforced code standards
- **TypeScript**: Full type safety
- **Prettier**: Code formatting (recommended)
- **Import organization**: Consistent import ordering

## 🌐 Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```env
   NEXT_PUBLIC_API_URL=https://your-api-domain.com/api/v1
   NODE_ENV=production
   ```

3. **Deploy to your platform** (Vercel, Netlify, etc.)

## 🔒 Security Considerations

- **JWT Tokens**: Stored in secure, httpOnly cookies
- **CSRF Protection**: SameSite cookie attributes
- **XSS Prevention**: Input sanitization and CSP headers
- **Route Protection**: Server-side authentication checks
- **API Security**: Request/response validation

## 📋 Features Roadmap

### Implemented ✅
- [x] JWT Authentication system
- [x] Dashboard with analytics
- [x] Organization management
- [x] Payment monitoring
- [x] Onboarding request reviews
- [x] Responsive design
- [x] Type-safe API client

### Planned 📋
- [ ] Advanced analytics and reporting
- [ ] Bulk operations for organizations
- [ ] Real-time notifications
- [ ] Audit trail system
- [ ] Advanced search and filtering
- [ ] Data export functionality
- [ ] Multi-language support
- [ ] Dark mode theme

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **Email**: admin@copay.rw
- **Documentation**: [Internal Wiki]
- **Issues**: [GitHub Issues]

---

**Copay Super Admin Portal** - Empowering cooperative management through technology 🚀

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
