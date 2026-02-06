'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Salasanan tulee olla vähintään 6 merkkiä'); return; }
    setIsSubmitting(true);
    const { error } = await signUpWithEmail(email, password, displayName);
    if (error) { setError(error.message); } else { setSuccess(true); }
    setIsSubmitting(false);
  };

  const handleGoogleSignup = async () => {
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-600/20 flex items-center justify-center"><svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
          <h2 className="text-xl font-bold text-white mb-2">Tili luotu!</h2>
          <p className="text-zinc-400 text-sm mb-6">Lähetimme vahvistuslinkin osoitteeseen <strong className="text-zinc-300">{email}</strong>. Tarkista sähköpostisi.</p>
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium text-sm">Siirry kirjautumaan</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg mb-4"><span className="text-2xl">📍</span></div>
          <h1 className="text-2xl font-bold text-white">Tilannetieto.fi</h1>
          <p className="text-zinc-400 text-sm mt-1">Luo uusi tili</p>
        </div>
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 space-y-5">
          {error && <div className="bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-3 text-sm text-red-300">{error}</div>}
          <button onClick={handleGoogleSignup} className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 font-medium rounded-lg px-4 py-3 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Rekisteröidy Google-tilillä
          </button>
          <div className="flex items-center gap-3"><div className="flex-1 h-px bg-zinc-700" /><span className="text-xs text-zinc-500 uppercase">tai</span><div className="flex-1 h-px bg-zinc-700" /></div>
          <form onSubmit={handleSignup} className="space-y-4">
            <div><label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1.5">Nimi</label><input id="name" type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="Matti Meikäläinen" /></div>
            <div><label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">Sähköposti</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="nimi@esimerkki.fi" /></div>
            <div><label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">Salasana</label><input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="Vähintään 6 merkkiä" /></div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium rounded-lg px-4 py-2.5 transition-colors">{isSubmitting ? 'Luodaan tiliä...' : 'Luo tili'}</button>
          </form>
          <div className="text-center"><p className="text-sm text-zinc-400">Onko sinulla jo tili? <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Kirjaudu sisään</Link></p></div>
        </div>
        <div className="text-center mt-6"><Link href="/" className="text-sm text-zinc-500 hover:text-zinc-400 inline-flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Takaisin karttaan</Link></div>
      </div>
    </div>
  );
}
