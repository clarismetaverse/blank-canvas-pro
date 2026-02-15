import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-6">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-neutral-900">Login VIC</h1>
          <p className="text-sm text-neutral-500">Welcome back</p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-neutral-600">Email</Label>
            <Input className="rounded-xl border-neutral-200 bg-[#FAFAFA] text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-neutral-400" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-neutral-600">Password</Label>
            <div className="relative">
              <Input className="rounded-xl border-neutral-200 bg-[#FAFAFA] text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-neutral-400" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700" onClick={() => setShow((s) => !s)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] disabled:opacity-50">
            {loading ? 'Accessing...' : 'Login'}
          </button>
        </form>
        <p className="text-center text-sm text-neutral-500">No account? <Link className="font-medium text-neutral-900 hover:underline" to="/register">Register</Link></p>
      </div>
    </div>
  );
}
