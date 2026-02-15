import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return;
    await register(name, email, password);
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-6">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-neutral-900">Create account</h1>
          <p className="text-sm text-neutral-500">Join VIC</p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2"><Label className="text-xs font-medium text-neutral-600">Name</Label><Input className="rounded-xl border-neutral-200 bg-[#FAFAFA] text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-neutral-400" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="space-y-2"><Label className="text-xs font-medium text-neutral-600">Email</Label><Input className="rounded-xl border-neutral-200 bg-[#FAFAFA] text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-neutral-400" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="space-y-2"><Label className="text-xs font-medium text-neutral-600">Password</Label><Input className="rounded-xl border-neutral-200 bg-[#FAFAFA] text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-neutral-400" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <div className="space-y-2"><Label className="text-xs font-medium text-neutral-600">Confirm password</Label><Input className="rounded-xl border-neutral-200 bg-[#FAFAFA] text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-neutral-400" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
          <button type="submit" className="w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)]">Register</button>
        </form>
        <p className="text-center text-sm text-neutral-500">Already registered? <Link className="font-medium text-neutral-900 hover:underline" to="/login">Login</Link></p>
      </div>
    </div>
  );
}
