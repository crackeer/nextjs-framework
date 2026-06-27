import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from '../components/ui/card';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
            const resp = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '登录失败');
                return;
            }
            toast.success('登录成功');
            const next = typeof router.query.next === 'string' ? router.query.next : '/';
            router.replace(next);
        } catch (err) {
            toast.error('网络错误：' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-4">
            <Card className="w-full max-w-sm">
                <form onSubmit={onSubmit}>
                    <CardHeader>
                        <CardTitle>登录</CardTitle>
                        <CardDescription>请输入账号密码登录后台</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                            <label htmlFor="username" className="text-sm font-medium">
                                用户名
                            </label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-sm font-medium">
                                密码
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? '登录中…' : '登录'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
