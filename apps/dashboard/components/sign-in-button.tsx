'use client';

import { signIn } from 'next-auth/react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SignInButton() {
  return (
    <Button size="lg" onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}>
      <LogIn className="h-4 w-4" />
      Đăng nhập với Discord
    </Button>
  );
}
