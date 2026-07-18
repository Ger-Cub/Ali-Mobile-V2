import React, { useState, useEffect } from 'react';
import { ShieldAlert, PhoneCall, RefreshCw, Smartphone as PhoneIcon, CheckCircle2, Lock, Unlock, Wifi, Battery } from 'lucide-react';
import { Client, Contract, Smartphone, USD_TO_CDF, AliMobileDB } from '../data/db';

interface KnoxSimulatorProps {
  contract: Contract;
  client: Client;
  smartphone: Smartphone;
  onUnlockSuccess?: () => void;
}

export const KnoxSimulator: React.FC<KnoxSimulatorProps> = ({
  contract,
  client,
  smartphone,
  onUnlockSuccess
}) => {
  const [isLocked, setIsLocked] = useState(contract.status === 'bloque');
  const [pin, setPin] = useState('');
  const [statusText, setStatusText] = useState<'locked' | 'paying' | 'unlocked'>('locked');
  const [simulatedTime, setSimulatedTime] = useState('08:00');

  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    setIsLocked(contract.status === 'bloque');
    setStatusText(contract.status === 'bloque' ? 'locked' : 'unlocked');
    setPinError(false);
  }, [contract]);

  useEffect(() => {
    // Current simulated time
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setSimulatedTime(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulatePayment = () => {
    setStatusText('paying');
    setPinError(false);
    
    // Simulate mobile money API check delay (2 seconds instead of 2 minutes for demo!)
    setTimeout(() => {
      // Create a successful payment in DB
      try {
        AliMobileDB.addPayment(
          contract.contractNumber,
          contract.installmentAmountUsd,
          'Mobile Money (M-Pesa)',
          'agent-1', // system auto-agent
          `MP-AUTO-${Math.floor(100000 + Math.random() * 900000)}`
        );
        
        setIsLocked(false);
        setStatusText('unlocked');
        if (onUnlockSuccess) {
          onUnlockSuccess();
        }
      } catch (err) {
        console.error(err);
        setStatusText('locked');
      }
    }, 2500);
  };

  const handleEnterPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(false);
    // Simulate manual administrative bypass code (for testing, code is 1234 or 2026)
    if (pin === '2026' || pin === '1234') {
      setStatusText('paying');
      setTimeout(() => {
        setIsLocked(false);
        setStatusText('unlocked');
        if (onUnlockSuccess) {
          onUnlockSuccess();
        }
      }, 1000);
    } else {
      setPinError(true);
      setPin('');
      setTimeout(() => setPinError(false), 4000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Container Device Body */}
      <div className="w-[310px] h-[620px] bg-neutral-900 rounded-[40px] border-8 border-neutral-800 p-2 shadow-2xl relative flex flex-col justify-between overflow-hidden ring-1 ring-neutral-700">
        
        {/* Top Camera Notch */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-neutral-800 rounded-full z-30 flex items-center justify-center">
          <div className="w-3 h-3 bg-neutral-900 rounded-full border border-neutral-750 mr-2"></div>
          <div className="w-8 h-1.5 bg-neutral-900 rounded-full"></div>
        </div>

        {/* Status Bar */}
        <div className="flex justify-between items-center px-6 pt-3 pb-1 z-20 text-[10px] text-neutral-400 font-medium">
          <span>{simulatedTime}</span>
          <div className="flex items-center space-x-1.5">
            <Wifi className="w-3 h-3" />
            <span className="text-[9px]">4G</span>
            <Battery className="w-3 h-3 rotate-90" />
            <span>92%</span>
          </div>
        </div>

        {/* Locked Knox Screen */}
        {isLocked && statusText === 'locked' && (
          <div className="flex-grow flex flex-col justify-between px-5 py-4 z-10 bg-black text-white select-none">
            {/* Knox Brand Icon */}
            <div className="flex flex-col items-center mt-6">
              <div className="p-2 bg-red-900/40 rounded-full border border-red-500/50 mb-1">
                <Lock className="w-6 h-6 text-red-500 animate-pulse" />
              </div>
              <div className="text-[11px] uppercase tracking-widest text-red-500 font-bold font-display">
                SAMSUNG Knox Custom Lock
              </div>
              <div className="text-[10px] text-neutral-550 font-mono mt-0.5">
                Device Protected by ALI MOBILE
              </div>
            </div>

            {/* Lock Details Container */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 my-auto text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-100 font-display">
                APPAREIL BLOQUÉ
              </h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Ce smartphone a été suspendu automatiquement par le système <span className="font-semibold text-white">ALI MOBILE</span> en raison d'un retard de paiement.
              </p>

              <div className="border-t border-neutral-900 pt-2.5 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-500">Contrat :</span>
                  <span className="font-mono text-neutral-300 font-semibold">{contract.contractNumber}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-500">Montant dû :</span>
                  <span className="font-mono text-red-400 font-bold">{contract.installmentAmountUsd.toFixed(2)} $</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-500">Équivalent :</span>
                  <span className="font-mono text-neutral-300">{(contract.installmentAmountUsd * USD_TO_CDF).toLocaleString()} CDF</span>
                </div>
              </div>
            </div>

            {/* Actions / Instructions Area */}
            <div className="space-y-2 mb-3">
              <button
                onClick={handleSimulatePayment}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-950"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Payer {contract.installmentAmountUsd.toFixed(2)} $ via M-Pesa</span>
              </button>

              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-900 text-center">
                <a
                  href="tel:+243824444298"
                  className="inline-flex items-center space-x-1.5 text-xs text-neutral-300 hover:text-white transition font-mono font-bold"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Support: +243 824 444 298</span>
                </a>
                <span className="text-[8px] text-neutral-500 block mt-0.5">Assistance technique et déblocage manuel</span>
              </div>

              {/* Secret Admin Unlock for testing */}
              <form onSubmit={handleEnterPin} className="flex flex-col space-y-1">
                <div className="flex space-x-1">
                  <input
                    type="password"
                    placeholder="Code de déblocage..."
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="flex-grow bg-neutral-950 border border-neutral-900 rounded text-center text-xs font-mono text-white py-1 focus:outline-none focus:border-neutral-700"
                  />
                  <button type="submit" className="px-2 bg-neutral-800 hover:bg-neutral-750 text-[10px] rounded border border-neutral-700 text-neutral-300 font-bold">
                    Bypass
                  </button>
                </div>
                {pinError && (
                  <span className="text-[9px] text-red-500 font-bold font-mono text-center block mt-0.5 animate-pulse">
                    Code incorrect (utilisez 1234 ou 2026)
                  </span>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Payment In Progress State */}
        {isLocked && statusText === 'paying' && (
          <div className="flex-grow flex flex-col items-center justify-center px-6 z-10 bg-black text-center space-y-4">
            <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" />
            <h4 className="text-sm font-bold text-neutral-100 font-display">
              Vérification du Paiement...
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed max-w-[200px]">
              Vérification automatique de la transaction Mobile Money. Le déblocage interviendra dans moins de 2 minutes.
            </p>
            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-950/40 px-3 py-1 rounded border border-emerald-900/40 animate-pulse">
              Knox API Syncing...
            </span>
          </div>
        )}

        {/* Unlocked Home Screen */}
        {(!isLocked || statusText === 'unlocked') && (
          <div className="flex-grow flex flex-col justify-between px-5 py-4 z-10 bg-gradient-to-b from-neutral-800 via-neutral-900 to-black text-white relative">
            
            {/* Success notification banner */}
            <div className="absolute top-10 inset-x-4 bg-emerald-900/90 border border-emerald-500/50 rounded-xl p-2.5 flex items-start space-x-2 z-40 shadow-lg animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold block text-white">Appareil débloqué !</span>
                <span className="text-[9px] text-emerald-200 block">Félicitations. Ali Mobile vous remercie pour votre paiement.</span>
              </div>
            </div>

            {/* Wallpaper Clock */}
            <div className="text-center mt-12">
              <h1 className="text-3xl font-light tracking-wide">{simulatedTime}</h1>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">Samedi, 18 Juillet 2026</span>
            </div>

            {/* App Icons Grid */}
            <div className="grid grid-cols-4 gap-y-4 gap-x-2 my-auto px-1">
              {[
                { icon: '📞', label: 'Téléphone' },
                { icon: '💬', label: 'WhatsApp' },
                { icon: '📸', label: 'Photos' },
                { icon: '🌐', label: 'Chrome' },
                { icon: '🎵', label: 'Musique' },
                { icon: '🗺️', label: 'Maps' },
                { icon: '⚙️', label: 'Paramètres' },
                { icon: '🛡️', label: 'Knox Portal' }
              ].map((app, i) => (
                <div key={i} className="flex flex-col items-center justify-center group cursor-pointer">
                  <div className="w-11 h-11 bg-neutral-800 hover:bg-neutral-750 active:scale-95 rounded-2xl flex items-center justify-center text-xl shadow-md border border-neutral-700 transition">
                    {app.icon}
                  </div>
                  <span className="text-[9px] text-neutral-400 mt-1 truncate max-w-full text-center">
                    {app.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom launcher row */}
            <div className="bg-neutral-900/80 backdrop-blur-sm p-2 rounded-2xl border border-neutral-800/60 flex justify-around mb-2">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-lg shadow-inner">📞</div>
              <div className="w-9 h-9 bg-neutral-800 rounded-xl flex items-center justify-center text-lg shadow-inner">💬</div>
              <div className="w-9 h-9 bg-neutral-800 rounded-xl flex items-center justify-center text-lg shadow-inner">🌐</div>
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-lg shadow-inner">⚙️</div>
            </div>
          </div>
        )}

        {/* Android Home Navigation Bar */}
        <div className="h-6 flex items-center justify-center space-x-12 z-20 pb-1">
          <button onClick={() => setIsLocked(contract.status === 'bloque')} className="w-3.5 h-3.5 border-2 border-neutral-600 rounded-sm hover:border-white transition"></button>
          <button onClick={() => setIsLocked(contract.status === 'bloque')} className="w-3.5 h-3.5 bg-neutral-600 rounded-full hover:bg-white transition"></button>
          <button onClick={() => setIsLocked(contract.status === 'bloque')} className="w-3 h-3 bg-neutral-600 rotate-45 rounded-sm hover:bg-white transition"></button>
        </div>
      </div>

      <p className="text-[11px] text-neutral-500 mt-3 italic text-center max-w-[280px]">
        Appuyez sur "Payer" pour simuler instantanément la réception du paiement Mobile Money et l'un-lock Knox automatique.
      </p>
    </div>
  );
};
