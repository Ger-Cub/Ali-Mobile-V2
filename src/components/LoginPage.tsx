import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { KeyRound, Mail, Smartphone, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onLoginSuccess: (session: any) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.session) {
        onLoginSuccess(data.session);
      } else {
        setError('Session non établie. Veuillez réessayer.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Identifiants incorrects ou problème de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#1E293B]/80 backdrop-blur-md border border-[#334155]/60 p-8 rounded-none shadow-2xl relative z-10"
      >
        {/* Brand Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 text-white font-black text-3xl mb-4 shadow-lg shadow-orange-500/20">
            A
          </div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tight font-display">
            Ali Mobile
          </h1>
          <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-bold">
            Portail de Financement & Crédit
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-none text-red-400 text-xs flex items-start gap-2.5 font-medium leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
              Adresse Email Professionnelle
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@alimobile.com"
                className="w-full bg-[#0F172A] border border-[#334155] rounded-none text-sm pl-11 pr-4 py-3.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white font-medium transition placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0F172A] border border-[#334155] rounded-none text-sm pl-11 pr-4 py-3.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white font-medium transition placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white hover:bg-orange-600 font-bold py-3.5 px-6 rounded-none text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Footer */}
        <div className="mt-8 pt-6 border-t border-[#334155]/40 text-center">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Accès sécurisé réservé aux agents agréés Ali Mobile Goma.
            <br />
            En cas de perte d'accès, contactez l'administrateur principal.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
