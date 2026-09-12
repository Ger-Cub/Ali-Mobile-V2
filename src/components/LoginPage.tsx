import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { KeyRound, Mail, Smartphone, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onLoginSuccess: (session: any) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  // Modes: 'login' | 'forgot_password' | 'reset_password'
  const [mode, setMode] = useState<'login' | 'forgot_password' | 'reset_password'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // New password form state (for reset password flow)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Detect recovery mode from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token'))) {
      setMode('reset_password');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset_password');
      } else if (event === 'SIGNED_IN' && session && mode === 'login') {
        onLoginSuccess(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Standard Login
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

  // Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Veuillez renseigner votre adresse email professionnelle.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccessMessage("Un lien de réinitialisation a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception.");
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || "Impossible d'envoyer l'email de réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  // Set New Password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("Veuillez renseigner et confirmer le mot de passe.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccessMessage("Votre mot de passe a été mis à jour avec succès ! Redirection en cours...");
      setTimeout(() => {
        // Clear hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        if (data.user) {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) onLoginSuccess(session);
            else setMode('login');
          });
        } else {
          setMode('login');
        }
      }, 1500);
    } catch (err: any) {
      console.error('Set password error:', err);
      setError(err.message || "Erreur lors de la mise à jour du mot de passe.");
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
            {mode === 'forgot_password'
              ? 'Récupération de mot de passe'
              : mode === 'reset_password'
              ? 'Définir un nouveau mot de passe'
              : 'Portail de Financement & Crédit'}
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

        {/* Success Alert */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-none text-emerald-400 text-xs flex items-start gap-2.5 font-medium leading-relaxed"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {/* MODE 1: Standard Login Form */}
        {mode === 'login' && (
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
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('forgot_password');
                  }}
                  className="text-[11px] text-orange-400 hover:text-orange-300 transition cursor-pointer font-medium"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-none text-sm pl-11 pr-12 py-3.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white font-medium transition placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition focus:outline-none cursor-pointer flex items-center justify-center"
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
        )}

        {/* MODE 2: Forgot Password Form */}
        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Saisissez votre adresse email professionnelle. Un lien sécurisé pour définir un nouveau mot de passe vous sera envoyé.
            </p>

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

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white hover:bg-orange-600 font-bold py-3.5 px-6 rounded-none text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Envoyer le lien de réinitialisation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour à la connexion</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: Set New Password Form (from recovery link or invite) */}
        {mode === 'reset_password' && (
          <form onSubmit={handleSetNewPassword} className="space-y-5">
            <div className="p-3.5 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0 text-orange-400" />
              <span>Veuillez choisir un mot de passe sécurisé pour votre compte Ali Mobile.</span>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                Nouveau mot de passe (min. 6 caractères)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-none text-sm pl-11 pr-12 py-3.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white font-medium transition placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition focus:outline-none cursor-pointer flex items-center justify-center"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-none text-sm pl-11 pr-4 py-3.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white font-medium transition placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white hover:bg-orange-600 font-bold py-3.5 px-6 rounded-none text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enregistrement du mot de passe...</span>
                  </>
                ) : (
                  <>
                    <span>Valider mon mot de passe</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Annuler et retourner</span>
              </button>
            </div>
          </form>
        )}

        {/* Info Footer */}
        <div className="mt-8 pt-6 border-t border-[#334155]/40 text-center">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Accès sécurisé réservé aux agents agréés Ali Mobile.
            <br />
            En cas de perte d'accès, contactez l'administrateur principal.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
