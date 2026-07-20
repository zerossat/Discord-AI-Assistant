import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Bot } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { SignInButton } from '@/components/sign-in-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 rounded-2xl bg-primary/10 p-3">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>Sử dụng tài khoản Discord của bạn để tiếp tục.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <SignInButton />
        </CardContent>
      </Card>
    </main>
  );
}
