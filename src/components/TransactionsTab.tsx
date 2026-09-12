import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Filter,
  PlusCircle,
  Search,
  CheckCircle2,
  Phone,
  User,
  Hash,
  FileText,
  DollarSign,
  Building2,
  RefreshCw,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { UtilityTransaction, Agent } from '../data/db';

interface TransactionsTabProps {
  transactions: UtilityTransaction[];
  agents: Agent[];
  currentUser: Agent | null;
  canCreate: boolean; // admin or operator
  onAddTransaction: (tx: Omit<UtilityTransaction, 'id' | 'createdAt'>) => Promise<void>;
  onRefresh: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  agents,
  currentUser,
  canCreate,
  onAddTransaction,
  onRefresh,
  showToast
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'dépôt' | 'retrait'>('all');
  const [filterOperator, setFilterOperator] = useState<'all' | 'Airtel' | 'Vodacom'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [clientName, setClientName] = useState('');
  const [transactionType, setTransactionType] = useState<'dépôt' | 'retrait'>('dépôt');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [operator, setOperator] = useState<'Airtel' | 'Vodacom'>('Airtel');
  const [operatorTxNum, setOperatorTxNum] = useState('');
  const [referenceNum, setReferenceNum] = useState('');
  const [reason, setReason] = useState('');

  // Auto-generate reference number when opening modal
  const openNewModal = () => {
    const randomRef = `UTX-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setReferenceNum(randomRef);
    setClientName('');
    setTransactionType('dépôt');
    setPhoneNumber('');
    setAmount('');
    setOperator('Airtel');
    setOperatorTxNum('');
    setReason('');
    setShowModal(true);
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch =
        tx.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.phoneNumber.includes(searchTerm) ||
        tx.operatorTransactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.reason.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = filterType === 'all' || tx.transactionType === filterType;
      const matchOp = filterOperator === 'all' || tx.operator === filterOperator;

      return matchSearch && matchType && matchOp;
    });
  }, [transactions, searchTerm, filterType, filterOperator]);

  // KPIs
  const totalDepots = useMemo(() => {
    return transactions
      .filter(t => t.transactionType === 'dépôt')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalRetraits = useMemo(() => {
    return transactions
      .filter(t => t.transactionType === 'retrait')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalVolume = totalDepots + totalRetraits;

  // Handle Export to Excel
  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      showToast("Aucune transaction à exporter.", "error");
      return;
    }

    try {
      const dataToExport = filteredTransactions.map((tx, idx) => {
        const agent = agents.find(a => a.id === tx.operatorId);
        return {
          "N°": idx + 1,
          "Date & Heure": new Date(tx.createdAt).toLocaleString('fr-FR'),
          "Nom du Client": tx.clientName,
          "Téléphone": tx.phoneNumber,
          "Type": tx.transactionType === 'dépôt' ? 'DÉPÔT' : 'RETRAIT',
          "Montant ($ USD)": tx.amount,
          "Opérateur Télécom": tx.operator,
          "N° Transaction Opérateur": tx.operatorTransactionNumber,
          "N° Référence Interne": tx.referenceNumber,
          "Motif": tx.reason,
          "Agent / Opérateur": agent ? `${agent.name} (${agent.code})` : 'N/A',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      // Auto column width
      const colWidths = [
        { wch: 5 },  // N°
        { wch: 20 }, // Date
        { wch: 25 }, // Client
        { wch: 16 }, // Tel
        { wch: 12 }, // Type
        { wch: 16 }, // Montant
        { wch: 18 }, // Opérateur
        { wch: 25 }, // N° Trans
        { wch: 22 }, // Ref
        { wch: 30 }, // Motif
        { wch: 25 }, // Agent
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions Utilités');

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `AliMobile_Transactions_Utilites_${dateStr}.xlsx`);
      showToast("Fichier Excel des transactions exporté avec succès !");
    } catch (err: any) {
      console.error('Export error:', err);
      showToast("Erreur lors de l'exportation Excel", "error");
    }
  };

  // Submit new transaction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !phoneNumber || !amount || !operatorTxNum || !referenceNum || !reason) {
      showToast("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast("Le montant doit être un nombre supérieur à 0.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddTransaction({
        clientName,
        transactionType,
        phoneNumber,
        amount: numAmount,
        operator,
        operatorTransactionNumber: operatorTxNum,
        referenceNumber: referenceNum,
        reason,
        operatorId: currentUser?.id || 'admin',
      });

      showToast(`Transaction ${transactionType.toUpperCase()} de ${numAmount} $ enregistrée avec succès !`);
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erreur lors de l'enregistrement de la transaction", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tight font-display">
              Transactions Utilités
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Airtel & Vodacom
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Service de vente et de gestion des flux d'utilités (dépôts et retraits d'argent)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider border border-slate-700 transition cursor-pointer"
            title="Exporter la table en Excel .xlsx"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exporter .XLSX</span>
          </button>

          {canCreate && (
            <button
              onClick={openNewModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouvelle Transaction</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Volume Global</span>
            <div className="w-9 h-9 bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white font-mono">{totalVolume.toLocaleString('fr-FR')} $</span>
            <p className="text-[11px] text-slate-500 mt-1">{transactions.length} transactions au total</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Dépôts</span>
            <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-400 font-mono">{totalDepots.toLocaleString('fr-FR')} $</span>
            <p className="text-[11px] text-slate-500 mt-1">
              {transactions.filter(t => t.transactionType === 'dépôt').length} opérations entrantes
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Retraits</span>
            <div className="w-9 h-9 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-400 font-mono">{totalRetraits.toLocaleString('fr-FR')} $</span>
            <p className="text-[11px] text-slate-500 mt-1">
              {transactions.filter(t => t.transactionType === 'retrait').length} opérations sortantes
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Répartition Opérateur</span>
            <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block" />
              <span className="text-slate-300">Airtel:</span>
              <span className="font-bold text-white">{transactions.filter(t => t.operator === 'Airtel').length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full inline-block" />
              <span className="text-slate-300">Vodacom:</span>
              <span className="font-bold text-white">{transactions.filter(t => t.operator === 'Vodacom').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par client, téléphone, N° transaction, référence..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1">
            <span className="text-[10px] text-slate-500 uppercase px-2 font-bold">Type :</span>
            {(['all', 'dépôt', 'retrait'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 text-xs font-bold uppercase transition ${
                  filterType === type
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type === 'all' ? 'Tous' : type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1">
            <span className="text-[10px] text-slate-500 uppercase px-2 font-bold">Opérateur :</span>
            {(['all', 'Airtel', 'Vodacom'] as const).map(op => (
              <button
                key={op}
                onClick={() => setFilterOperator(op)}
                className={`px-3 py-1 text-xs font-bold uppercase transition ${
                  filterOperator === op
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {op === 'all' ? 'Tous' : op}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="py-3 px-4">Date / Réf</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4">Opérateur</th>
                <th className="py-3 px-4">N° Trans. Opérateur</th>
                <th className="py-3 px-4">Motif</th>
                <th className="py-3 px-4">Agent Enregistreur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                    <p className="font-bold">Aucune transaction trouvée</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      {searchTerm || filterType !== 'all' || filterOperator !== 'all'
                        ? 'Essayez de modifier vos filtres'
                        : 'Enregistrez votre première transaction'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const agent = agents.find(a => a.id === tx.operatorId);
                  const isDeposit = tx.transactionType === 'dépôt';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-white font-bold text-xs">{tx.referenceNumber}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{tx.clientName}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {tx.phoneNumber}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            isDeposit
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isDeposit ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-sm">
                        <span className={isDeposit ? 'text-emerald-400' : 'text-rose-400'}>
                          {isDeposit ? '+' : '-'}{tx.amount.toLocaleString('fr-FR')} $
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            tx.operator === 'Airtel'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-rose-600/10 text-rose-300 border border-rose-600/20'
                          }`}
                        >
                          {tx.operator}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {tx.operatorTransactionNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-[200px] truncate" title={tx.reason}>
                        {tx.reason}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 font-medium">
                          {agent ? agent.name : 'Opérateur'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {agent?.city ? `Ville: ${agent.city}` : 'Goma'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Nouvelle Transaction */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 text-white flex items-center justify-center font-bold">
                    A
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase italic tracking-tight font-display">
                      Enregistrer une Transaction
                    </h2>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Service d'Utilités Ali Mobile
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white transition p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Reference Interne */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                    N° Référence Interne (Généré)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={referenceNum}
                    className="w-full bg-slate-950 border border-slate-800 text-orange-400 font-mono text-xs px-3.5 py-2.5 focus:outline-none"
                  />
                </div>

                {/* Type de transaction */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                    Type de Transaction *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTransactionType('dépôt')}
                      className={`py-3 px-4 border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                        transactionType === 'dépôt'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>Dépôt d'argent</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTransactionType('retrait')}
                      className={`py-3 px-4 border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                        transactionType === 'retrait'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Retrait d'argent</span>
                    </button>
                  </div>
                </div>

                {/* Opérateur Telecom */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                    Opérateur Télécom *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOperator('Airtel')}
                      className={`py-2.5 px-4 border text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                        operator === 'Airtel'
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Airtel Money
                    </button>

                    <button
                      type="button"
                      onClick={() => setOperator('Vodacom')}
                      className={`py-2.5 px-4 border text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                        operator === 'Vodacom'
                          ? 'bg-rose-600/20 border-rose-600 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Vodacom M-Pesa
                    </button>
                  </div>
                </div>

                {/* Nom du Client & Téléphone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                      Nom complet du Client *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Patrick Kambale"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                      Numéro de Téléphone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+243 ..."
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3.5 py-2.5 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                {/* Montant ($) & Numéro Transaction Opérateur */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                      Montant ($ USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3.5 py-2.5 focus:outline-none focus:border-orange-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                      N° Transaction Opérateur (SMS/Reçu) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: MP240912.1450"
                      value={operatorTxNum}
                      onChange={e => setOperatorTxNum(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3.5 py-2.5 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                {/* Motif */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                    Motif de la transaction *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="ex: Dépôt pour achat crédit d'appel / Retrait pour urgence..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enregistrement...' : 'Valider la Transaction'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

