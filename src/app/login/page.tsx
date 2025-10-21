
'use client';

import { LoginForm } from '@/components/login-form';
import Logo from '@/components/icons/logo';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
            <Logo className="w-16 h-16" />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
