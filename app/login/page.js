import LoginForm from '@/components/auth/login-form'

export const metadata = {
  title: 'Admin Login',
  description: 'Secure access to the WBS Menu administrative dashboard. Manage your restaurant digital menu and orders.',
  openGraph: {
    title: 'Admin Login | WBS Menu Admin',
    description: 'Access your restaurant administration panel securely.',
  },
}

export default function LoginPage() {
  return <LoginForm />
}
