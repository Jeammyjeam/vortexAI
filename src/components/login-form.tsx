'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthActions } from '@/hooks/use-auth-handler';
import { Loader2 } from 'lucide-react';
import { Separator } from './ui/separator';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 48 48"
        >
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A7.98 7.98 0 0 1 24 36c-5.223 0-9.651-3.657-11.303-8H6.306C9.656 39.663 16.318 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.853 44 30.228 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
        </svg>
    );
}


export function LoginForm() {
    const {
        email,
        setEmail,
        password,
        setPassword,
        isSigningIn,
        handleEmailSignIn,
        handleGoogleSignIn,
    } = useAuthActions();

    return (
        <Card className="mx-auto max-w-sm w-full glassmorphic">
            <CardHeader>
                <CardTitle className="text-2xl font-orbitron">Operator Login</CardTitle>
                <CardDescription className="font-inter">Enter your credentials to access the Command Console</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                     <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="operator@vortex.ai"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isSigningIn}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isSigningIn}
                        />
                    </div>
                    <Button type="submit" className="w-full font-satoshi" onClick={handleEmailSignIn} disabled={isSigningIn}>
                        {isSigningIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Authenticate
                    </Button>
                    <Separator className='my-2 bg-border/50' />
                    <Button
                        variant="outline"
                        className="w-full font-satoshi"
                        onClick={handleGoogleSignIn}
                        disabled={isSigningIn}
                    >
                        {isSigningIn ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <GoogleIcon className="mr-2 h-4 w-4" />
                        )}
                        Sign In with Google
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
