import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Smartphone as PhoneIcon,
  FileText,
  Coins,
  ShieldAlert,
  Activity,
  PlusCircle,
  BadgeAlert,
  History,
  UserCheck,
  Settings,
  Printer,
  Search,
  X,
  ChevronRight,
  ArrowUpRight,
  UserX,
  CreditCard,
  CheckCircle,
  Database,
  RefreshCw,
  Clock,
  Briefcase,
  Layers,
  ChevronDown,
  Menu,
  Download,
  Lock,
  User,
  UserPlus,
  Upload,
  Image as ImageIcon,
  Trash2,
  LogOut,
  Loader2,
  ArrowLeftRight,
  AlertTriangle,
  Mail,
  Key,
  Edit3,
  Send,
  ShieldCheck,
  Check,
  Copy,
  MapPin,
  ExternalLink,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Client,
  Contract,
  Smartphone,
  Payment,
  DelayRecord,
  Agent,
  USD_TO_CDF,
  PaymentPlanType,
  UtilityTransaction
} from './data/db';
import { ContractDocument } from './components/ContractDocument';
import { KnoxSimulator } from './components/KnoxSimulator';
import { TransactionsTab } from './components/TransactionsTab';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { supabase } from './lib/supabase';
import { supabaseDB, mapAgent } from './lib/supabaseDB';
import { LoginPage } from './components/LoginPage';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contracts' | 'new_contract' | 'new_payment' | 'knox' | 'agents' | 'settings' | 'profile' | 'knox_stock' | 'transactions'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Session and Auth State
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<Agent | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Inactivity Session Timeout (30 minutes)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  // Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [delays, setDelays] = useState<DelayRecord[]>([]);
  const [smartphones, setSmartphones] = useState<Smartphone[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [transactions, setTransactions] = useState<UtilityTransaction[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string>('admin');

  // Interactive UI State
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<Client | null>(null);
  const [viewingContractDoc, setViewingContractDoc] = useState<Contract | null>(null);
  const [knoxSimulatingContract, setKnoxSimulatingContract] = useState<Contract | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Profile / Subordinate agent Creation form state
  const [newUserRole, setNewUserRole] = useState<'admin' | 'agent' | 'operator'>('agent');
  const [newUserCity, setNewUserCity] = useState('Bukavu');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserCode, setNewUserCode] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // User Management State in Settings
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'agent' | 'operator'>('all');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createPasswordOption, setCreatePasswordOption] = useState<'invite' | 'manual'>('invite');
  const [createdUserDirectLink, setCreatedUserDirectLink] = useState<{ email: string; name: string; link: string; tempPass?: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editAgentName, setEditAgentName] = useState('');
  const [editAgentPhone, setEditAgentPhone] = useState('');
  const [editAgentCity, setEditAgentCity] = useState('');
  const [editAgentRole, setEditAgentRole] = useState<'admin' | 'agent' | 'operator'>('agent');

  const [resetPasswordAgent, setResetPasswordAgent] = useState<Agent | null>(null);
  const [manualPasswordInput, setManualPasswordInput] = useState('');
  const [deleteAgentConfirm, setDeleteAgentConfirm] = useState<Agent | null>(null);
  const [isProcessingUserAction, setIsProcessingUserAction] = useState(false);

  // Self-profile editing state (current logged-in user)
  const [selfEditMode, setSelfEditMode] = useState(false);
  const [selfEditName, setSelfEditName] = useState('');
  const [selfEditPhone, setSelfEditPhone] = useState('');
  const [selfEditCity, setSelfEditCity] = useState('');
  const [isSavingSelfProfile, setIsSavingSelfProfile] = useState(false);

  // New Contract Form State
  const [formStep, setFormStep] = useState(1);
  const [clientForm, setClientForm] = useState({
    lastName: '',
    middleName: '',
    firstName: '',
    phoneWhatsApp: '',
    phoneUrgency: '',
    addressNum: '',
    addressAvenue: '',
    neighborhood: '',
    cityCommune: 'Bukavu',
    identityDocType: "Carte d'électeur" as Client['identityDocType'],
    identityDocNum: '',
    identityCardPhoto: '',
  });

  const [contractForm, setContractForm] = useState({
    smartphoneId: '',
    planType: 'hebdo' as PaymentPlanType,
    initialDepositUsd: 0,
    installmentAmountUsd: 0,
    totalInstallments: 8,
    paymentDay: 'Samedi',
    imeiInput: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    contractNumber: '',
    amountUsd: '',
    paymentMethod: 'Mobile Money (M-Pesa)' as Payment['paymentMethod'],
    transactionRef: '',
  });

  // Photo Upload Drag & Drop State
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  // Auth & Session Tracking
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchCurrentUser(session.user.id);
      } else {
        setLoadingSession(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchCurrentUser(session.user.id);
      } else {
        setCurrentUser(null);
        setLoadingSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Inactivity Session Timeout (30 minutes)
  useEffect(() => {
    if (!session) return;

    const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    const WARNING_BEFORE_MS = 2 * 60 * 1000; // Warning 2 min before expiration

    let timeoutId: any;
    let warningId: any;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      clearTimeout(warningId);
      setShowInactivityWarning(false);

      warningId = setTimeout(() => {
        setShowInactivityWarning(true);
      }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);

      timeoutId = setTimeout(async () => {
        setShowInactivityWarning(false);
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.error("Signout error:", e);
        }
        setSession(null);
        setCurrentUser(null);
        showToast("Votre session a expiré après 30 minutes d'inactivité pour des raisons de sécurité.", "error");
      }, INACTIVITY_TIMEOUT_MS);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(warningId);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [session]);

  const fetchCurrentUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('agents').select('*').eq('id', userId).single();

      if (error || !data) {
        // Fallback: build profile from JWT token metadata
        console.warn('Could not fetch agent from DB, using JWT metadata:', error?.message);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const meta = user.user_metadata || {};
          const fallbackAgent: Agent = {
            id: user.id,
            name: meta.name || user.email || 'Utilisateur',
            email: user.email || '',
            phone: meta.phone || '',
            code: meta.code || 'N/A',
            role: (meta.role as 'admin' | 'agent' | 'operator') || 'agent',
            city: meta.city || 'Bukavu',
          };
          setCurrentUser(fallbackAgent);
          if (fallbackAgent.role === 'admin' || fallbackAgent.role === 'operator') {
            setActiveAgentId('admin');
          } else {
            setActiveAgentId(fallbackAgent.id);
          }
          return;
        }
        throw error || new Error('Profil introuvable');
      }

      const mapped = mapAgent(data);
      setCurrentUser(mapped);

      // Default views: Admin and Operator see all records
      if (mapped.role === 'admin' || mapped.role === 'operator') {
        setActiveAgentId('admin');
      } else {
        setActiveAgentId(mapped.id);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      showToast('Erreur lors du chargement du profil.', 'error');
    } finally {
      setLoadingSession(false);
    }
  };

  // Realtime Subscriptions & Data Syncing
  useEffect(() => {
    if (!session) return;

    refreshData();

    // Subscribe to public schema changes in realtime
    const dbChangesChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        refreshData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dbChangesChannel);
    };
  }, [session]);

  const refreshData = async () => {
    try {
      const [a, s, c, co, p, d, tx] = await Promise.all([
        supabaseDB.getAgents(),
        supabaseDB.getSmartphones(),
        supabaseDB.getClients(),
        supabaseDB.getContracts(),
        supabaseDB.getPayments(),
        supabaseDB.getDelayRecords(),
        supabaseDB.getTransactions().catch(() => [] as UtilityTransaction[])
      ]);
      setAgents(a);
      setSmartphones(s);
      setClients(c);
      setContracts(co);
      setPayments(p);
      setDelays(d);
      setTransactions(tx || []);
    } catch (err) {
      console.error('Error refreshing data from Supabase:', err);
    }
  };

  const handleAddTransaction = async (txData: Omit<UtilityTransaction, 'id' | 'createdAt'>) => {
    await supabaseDB.addTransaction(txData);
    await refreshData();
  };

  // Export Contracts to Excel (.xlsx)
  const handleExportContractsExcel = () => {
    if (contracts.length === 0) {
      showToast("Aucun contrat à exporter.", "error");
      return;
    }

    try {
      const dataToExport = filteredContracts.map((c, idx) => {
        const client = clients.find(cl => cl.id === c.clientId);
        const phone = smartphones.find(sp => sp.id === c.smartphoneId);
        const agent = agents.find(a => a.id === c.agentId);

        const contractPayments = payments.filter(p => p.contractNumber === c.contractNumber && p.status === 'Terminé');
        const totalPaid = contractPayments.reduce((acc, curr) => acc + curr.amountUsd, 0);
        const totalCost = c.initialDepositUsd + (c.installmentAmountUsd * c.totalInstallments);
        const remaining = Math.max(0, totalCost - totalPaid);

        return {
          "N°": idx + 1,
          "N° Contrat": c.contractNumber,
          "Date Souscription": c.subscriptionDate,
          "Nom Client": client ? `${client.lastName} ${client.middleName || ''} ${client.firstName}`.trim() : 'N/A',
          "Téléphone WhatsApp": client?.phoneWhatsApp || 'N/A',
          "Téléphone Urgence": client?.phoneUrgency || 'N/A',
          "Type Pièce": client?.identityDocType || 'N/A',
          "N° Pièce": client?.identityDocNum || 'N/A',
          "Adresse Client": client ? `${client.addressNum} Av. ${client.addressAvenue}, Q. ${client.neighborhood}, ${client.cityCommune}` : 'N/A',
          "Smartphone": phone ? `${phone.brand} ${phone.model}` : 'N/A',
          "IMEI": phone?.imei || 'N/A',
          "Valeur Téléphone ($)": phone?.valueUsd || 0,
          "Plan": c.planType === 'hebdo' ? 'Hebdomadaire (8x)' : 'Mensuel (2x)',
          "Acompte Initial ($)": c.initialDepositUsd,
          "Montant Échéance ($)": c.installmentAmountUsd,
          "Nb Échéances": c.totalInstallments,
          "Jour de Paiement": c.paymentDay,
          "Total Payé ($)": totalPaid,
          "Reste à Payer ($)": remaining,
          "Statut Contrat": c.status === 'termine' ? 'Acquitté' : c.status === 'bloque' ? 'Bloqué Knox' : c.status === 'en_retard' ? 'En retard' : 'En cours',
          "Agent Responsable": agent?.name || 'N/A',
          "Code Agent": agent?.code || 'N/A',
          "Ville Agent": agent?.city || 'Bukavu',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contrats Ali Mobile');

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `AliMobile_Contrats_${dateStr}.xlsx`);
      showToast("Fichier Excel des contrats exporté avec succès !");
    } catch (err: any) {
      console.error('Export error:', err);
      showToast("Erreur lors de l'exportation des contrats", "error");
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Agent Changer
  const handleAgentChange = (id: string) => {
    setActiveAgentId(id);
    showToast(`Session changée : ${id === 'admin' ? 'Administrateur' : agents.find(a => a.id === id)?.name}`);
  };

  // Reset database (disabled in prod)
  const handleResetDB = () => {
    showToast("La réinitialisation globale de la base de données est désactivée en production.", "error");
  };

  // Auto-generate code for new subordinate/agent/operator
  useEffect(() => {
    const nextNum = agents.length + 1;
    if (newUserRole === 'admin') {
      setNewUserCode(`AD-243-0${nextNum}`);
    } else if (newUserRole === 'operator') {
      setNewUserCode(`OP-243-0${nextNum}`);
    } else {
      setNewUserCode(`AG-243-0${nextNum}`);
    }
  }, [newUserRole, agents]);

  // Handle creation of agent/operator/sub-admin
  const handleCreateSubordinate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPhone || !newUserCode || !newUserCity) {
      showToast("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }

    if (createPasswordOption === 'manual' && (!newUserPassword || newUserPassword.length < 6)) {
      showToast("Le mot de passe doit comporter au moins 6 caractères.", "error");
      return;
    }

    try {
      setIsProcessingUserAction(true);
      showToast("Création du compte en cours...");
      const pass = createPasswordOption === 'manual' ? newUserPassword : undefined;
      await supabaseDB.createAgent({
        name: newUserName,
        email: newUserEmail,
        phone: newUserPhone,
        code: newUserCode,
        role: newUserRole,
        city: newUserCity,
      }, pass);

      // If invite option, send reset email so user defines password
      if (createPasswordOption === 'invite') {
        try {
          await supabaseDB.sendPasswordResetEmail(newUserEmail);
          showToast(`Email d'invitation avec réinitialisation envoyé à ${newUserEmail}`);
        } catch (emailErr) {
          console.warn("Could not send invite email directly:", emailErr);
        }
      }

      const roleLabel = newUserRole === 'admin' ? 'Administrateur Adjoint' : newUserRole === 'operator' ? 'Opérateur Utilités' : 'Agent de Vente';
      showToast(`${roleLabel} créé avec succès !`);

      const directLink = `${window.location.origin}/#type=recovery&email=${encodeURIComponent(newUserEmail)}`;
      setCreatedUserDirectLink({
        email: newUserEmail,
        name: newUserName,
        link: directLink,
        tempPass: createPasswordOption === 'manual' ? newUserPassword : undefined
      });

      // Reset form fields
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPhone('');
      setNewUserPassword('');
      setNewUserCity('Bukavu');
      setShowCreateUserModal(false);
      await refreshData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erreur lors de la création du compte", "error");
    } finally {
      setIsProcessingUserAction(false);
    }
  };

  // Update an agent's role
  const handleUpdateAgentRole = async (agent: Agent, newRole: 'admin' | 'agent' | 'operator') => {
    if (agent.id === currentUser?.id && newRole !== 'admin') {
      showToast("Vous ne pouvez pas révoquer vos propres droits administrateur.", "error");
      return;
    }
    try {
      setIsProcessingUserAction(true);
      await supabaseDB.updateAgent(agent.id, { role: newRole });
      const roleLabel = newRole === 'admin' ? 'Administrateur' : newRole === 'operator' ? 'Opérateur Utilités' : 'Agent de Vente';
      showToast(`Rôle de ${agent.name} mis à jour : ${roleLabel}`);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la mise à jour du rôle", "error");
    } finally {
      setIsProcessingUserAction(false);
    }
  };

  // Trigger password reset email for an employee
  const handleSendResetPasswordEmail = async (agent: Agent) => {
    try {
      setIsProcessingUserAction(true);
      await supabaseDB.sendPasswordResetEmail(agent.email);
      showToast(`Email de réinitialisation envoyé à ${agent.email}`);
    } catch (err: any) {
      showToast(err.message || "Erreur lors de l'envoi de l'email de réinitialisation", "error");
    } finally {
      setIsProcessingUserAction(false);
    }
  };

  // Directly set agent password
  const handleDirectSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordAgent || !manualPasswordInput || manualPasswordInput.length < 6) {
      showToast("Le mot de passe doit contenir au moins 6 caractères.", "error");
      return;
    }
    try {
      setIsProcessingUserAction(true);
      await supabaseDB.setAgentPassword(resetPasswordAgent.id, manualPasswordInput);
      showToast(`Mot de passe mis à jour avec succès pour ${resetPasswordAgent.name}`);
      setResetPasswordAgent(null);
      setManualPasswordInput('');
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la mise à jour du mot de passe", "error");
    } finally {
      setIsProcessingUserAction(false);
    }
  };

  // Delete agent
  const handleDeleteAgent = async () => {
    if (!deleteAgentConfirm) return;
    if (deleteAgentConfirm.id === currentUser?.id) {
      showToast("Vous ne pouvez pas supprimer votre propre compte.", "error");
      return;
    }
    const hasActiveContracts = contracts.some(c => c.agentId === deleteAgentConfirm.id && c.status !== 'termine');
    if (hasActiveContracts) {
      showToast(`Impossible de supprimer ${deleteAgentConfirm.name} : cet agent gère des contrats actifs en cours.`, "error");
      return;
    }
    try {
      setIsProcessingUserAction(true);
      await supabaseDB.deleteAgent(deleteAgentConfirm.id);
      showToast(`Utilisateur ${deleteAgentConfirm.name} supprimé avec succès.`);
      setDeleteAgentConfirm(null);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la suppression de l'utilisateur", "error");
    } finally {
      setIsProcessingUserAction(false);
    }
  };

  // Open Edit Agent modal
  const handleOpenEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setEditAgentName(agent.name);
    setEditAgentPhone(agent.phone);
    setEditAgentCity(agent.city || 'Bukavu');
    setEditAgentRole(agent.role || 'agent');
  };

  // Save Edit Agent
  const handleSaveEditAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    try {
      setIsProcessingUserAction(true);
      await supabaseDB.updateAgent(editingAgent.id, {
        name: editAgentName,
        phone: editAgentPhone,
        city: editAgentCity,
        role: editAgentRole
      });
      showToast(`Informations de ${editAgentName} enregistrées.`);
      setEditingAgent(null);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la mise à jour", "error");
    } finally {
      setIsProcessingUserAction(false);
    }
  };

  // Save self-profile (current logged-in user edits own info)
  const handleSaveSelfProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      setIsSavingSelfProfile(true);
      await supabaseDB.updateAgent(currentUser.id, {
        name: selfEditName.trim(),
        phone: selfEditPhone.trim(),
        city: selfEditCity,
      });
      showToast('Profil mis à jour avec succès.');
      setSelfEditMode(false);
      if (session?.user?.id) await fetchCurrentUser(session.user.id);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la mise à jour du profil', 'error');
    } finally {
      setIsSavingSelfProfile(false);
    }
  };

  // New smartphone stock form state
  const [newPhoneBrand, setNewPhoneBrand] = useState('Samsung');
  const [newPhoneModel, setNewPhoneModel] = useState('');
  const [newPhoneValue, setNewPhoneValue] = useState('');
  const [newPhoneImei, setNewPhoneImei] = useState('');

  // Stock Knox Handlers
  const handleAddSmartphoneToStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoneBrand || !newPhoneModel || !newPhoneValue || !newPhoneImei) {
      showToast("Veuillez remplir tous les champs du terminal.", "error");
      return;
    }

    if (newPhoneImei.length !== 15 || !/^\d+$/.test(newPhoneImei)) {
      showToast("L'IMEI doit être composé de 15 chiffres.", "error");
      return;
    }

    if (smartphones.some(p => p.imei === newPhoneImei)) {
      showToast("Un smartphone avec cet IMEI existe déjà dans le stock.", "error");
      return;
    }

    try {
      const newDevice = await supabaseDB.addSmartphone({
        brand: newPhoneBrand,
        model: newPhoneModel,
        valueUsd: parseFloat(newPhoneValue),
        imei: newPhoneImei
      });

      showToast(`Appareil ${newDevice.brand} ${newDevice.model} enregistré avec succès !`);

      setNewPhoneModel('');
      setNewPhoneValue('');
      setNewPhoneImei('');
      refreshData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erreur lors de l'enregistrement de l'appareil", "error");
    }
  };

  const handleDeleteSmartphoneFromStock = async (phoneId: string) => {
    const isEngaged = contracts.some(c => c.smartphoneId === phoneId && c.status !== 'termine');
    if (isEngaged) {
      showToast("Impossible de supprimer cet appareil car il est engagé dans un contrat actif.", "error");
      return;
    }

    try {
      await supabaseDB.deleteSmartphone(phoneId);
      showToast("Appareil supprimé du stock.");
      refreshData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erreur de suppression du stock", "error");
    }
  };

  // Handle Photo Upload & Base64 conversion
  const handlePhotoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast("Veuillez sélectionner un fichier image valide (JPG, PNG).", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setClientForm(prev => ({
          ...prev,
          identityCardPhoto: e.target.result as string
        }));
        showToast("Photo de la pièce d'identité chargée !");
      }
    };
    reader.readAsDataURL(file);
  };

  // Dynamic values helper in forms
  const handleSmartphoneSelect = (phoneId: string) => {
    const phone = smartphones.find(p => p.id === phoneId);
    if (phone) {
      const defaultDeposit = Math.round(phone.valueUsd * 0.5);
      const installments = contractForm.planType === 'hebdo' ? 8 : 2;
      const remaining = phone.valueUsd - defaultDeposit;
      const instAmount = Number((remaining / installments).toFixed(2));
      const day = contractForm.planType === 'hebdo' ? 'Samedi' : '05';

      setContractForm(prev => ({
        ...prev,
        smartphoneId: phoneId,
        imeiInput: phone.imei,
        initialDepositUsd: defaultDeposit,
        installmentAmountUsd: instAmount,
        totalInstallments: installments,
        paymentDay: day
      }));
    } else {
      setContractForm(prev => ({
        ...prev,
        smartphoneId: '',
        imeiInput: '',
        initialDepositUsd: 0,
        installmentAmountUsd: 0
      }));
    }
  };

  const handleImeiChange = (val: string) => {
    const matchedPhone = smartphones.find(p => p.imei === val);

    if (matchedPhone) {
      if (matchedPhone.id !== contractForm.smartphoneId) {
        const defaultDeposit = Math.round(matchedPhone.valueUsd * 0.5);
        const installments = contractForm.planType === 'hebdo' ? 8 : 2;
        const remaining = matchedPhone.valueUsd - defaultDeposit;
        const instAmount = Number((remaining / installments).toFixed(2));
        const day = contractForm.planType === 'hebdo' ? 'Samedi' : '05';

        setContractForm(prev => ({
          ...prev,
          smartphoneId: matchedPhone.id,
          imeiInput: val,
          initialDepositUsd: defaultDeposit,
          installmentAmountUsd: instAmount,
          totalInstallments: installments,
          paymentDay: day
        }));
      } else {
        setContractForm(prev => ({
          ...prev,
          imeiInput: val
        }));
      }
    } else {
      // Look for fuzzy match / startswith to help select but don't force if typed incompletely
      const partialMatch = smartphones.find(p => p.imei.startsWith(val));
      if (partialMatch && val.length >= 6) {
        if (partialMatch.id !== contractForm.smartphoneId) {
          const defaultDeposit = Math.round(partialMatch.valueUsd * 0.5);
          const installments = contractForm.planType === 'hebdo' ? 8 : 2;
          const remaining = partialMatch.valueUsd - defaultDeposit;
          const instAmount = Number((remaining / installments).toFixed(2));
          const day = contractForm.planType === 'hebdo' ? 'Samedi' : '05';

          setContractForm(prev => ({
            ...prev,
            smartphoneId: partialMatch.id,
            imeiInput: val,
            initialDepositUsd: defaultDeposit,
            installmentAmountUsd: instAmount,
            totalInstallments: installments,
            paymentDay: day
          }));
          return;
        }
      }

      setContractForm(prev => ({
        ...prev,
        smartphoneId: '',
        imeiInput: val,
        initialDepositUsd: 0,
        installmentAmountUsd: 0
      }));
    }
  };

  const handlePlanTypeChange = (type: PaymentPlanType) => {
    const phone = smartphones.find(p => p.id === contractForm.smartphoneId);
    const installments = type === 'hebdo' ? 8 : 2;
    const day = type === 'hebdo' ? 'Samedi' : '05';

    if (phone) {
      const remaining = phone.valueUsd - contractForm.initialDepositUsd;
      const instAmount = Number((remaining / installments).toFixed(2));

      setContractForm(prev => ({
        ...prev,
        planType: type,
        totalInstallments: installments,
        installmentAmountUsd: instAmount >= 0 ? instAmount : 0,
        paymentDay: day
      }));
    } else {
      setContractForm(prev => ({
        ...prev,
        planType: type,
        totalInstallments: installments,
        paymentDay: day
      }));
    }
  };

  const handleInitialDepositChange = (amount: number) => {
    const phone = smartphones.find(p => p.id === contractForm.smartphoneId);
    const installments = contractForm.totalInstallments || (contractForm.planType === 'hebdo' ? 8 : 2);

    if (phone) {
      const remaining = phone.valueUsd - amount;
      const instAmount = Number((remaining / installments).toFixed(2));

      setContractForm(prev => ({
        ...prev,
        initialDepositUsd: amount,
        installmentAmountUsd: instAmount >= 0 ? instAmount : 0
      }));
    } else {
      setContractForm(prev => ({
        ...prev,
        initialDepositUsd: amount
      }));
    }
  };

  const handleTotalInstallmentsChange = (installments: number) => {
    const phone = smartphones.find(p => p.id === contractForm.smartphoneId);
    if (phone) {
      const remaining = phone.valueUsd - contractForm.initialDepositUsd;
      const instAmount = Number((remaining / (installments || 1)).toFixed(2));

      setContractForm(prev => ({
        ...prev,
        totalInstallments: installments,
        installmentAmountUsd: instAmount >= 0 ? instAmount : 0
      }));
    } else {
      setContractForm(prev => ({
        ...prev,
        totalInstallments: installments
      }));
    }
  };

  // Handle Contract creation
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractForm.smartphoneId) {
      showToast("Veuillez sélectionner un smartphone", "error");
      return;
    }

    try {
      // Find the current active agent
      const currentAgentId = activeAgentId === 'admin' ? currentUser?.id || 'admin' : activeAgentId;

      showToast("Création du contrat en cours...");
      const result = await supabaseDB.addContractWithClient(
        {
          ...clientForm,
          agentId: currentAgentId
        },
        {
          smartphoneId: contractForm.smartphoneId,
          subscriptionDate: new Date().toISOString().split('T')[0],
          planType: contractForm.planType,
          initialDepositUsd: contractForm.initialDepositUsd,
          installmentAmountUsd: contractForm.installmentAmountUsd,
          totalInstallments: contractForm.totalInstallments,
          paymentDay: contractForm.paymentDay,
          agentId: currentAgentId
        }
      );

      showToast(`Contrat ${result.contract.contractNumber} créé et enregistré !`);

      // Auto display contract for printing/saving
      setViewingContractDoc(result.contract);

      // Reset Form State
      setClientForm({
        lastName: '',
        middleName: '',
        firstName: '',
        phoneWhatsApp: '',
        phoneUrgency: '',
        addressNum: '',
        addressAvenue: '',
        neighborhood: '',
        cityCommune: 'Bukavu',
        identityDocType: "Carte d'électeur",
        identityDocNum: '',
        identityCardPhoto: '',
      });
      setContractForm({
        smartphoneId: '',
        planType: 'hebdo',
        initialDepositUsd: 0,
        installmentAmountUsd: 0,
        totalInstallments: 8,
        paymentDay: 'Samedi',
        imeiInput: '',
      });
      setFormStep(1);
      refreshData();
      setActiveTab('contracts');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erreur de création du contrat", "error");
    }
  };

  // Handle Payment Submitting
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.contractNumber || !paymentForm.amountUsd) {
      showToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

    try {
      const currentAgentId = activeAgentId === 'admin' ? currentUser?.id || 'admin' : activeAgentId;
      const amt = parseFloat(paymentForm.amountUsd);

      showToast("Validation du paiement...");
      const pay = await supabaseDB.addPayment(
        paymentForm.contractNumber,
        amt,
        paymentForm.paymentMethod,
        currentAgentId,
        paymentForm.transactionRef || undefined
      );

      showToast(`Paiement de ${amt.toFixed(2)} $ validé avec succès pour le contrat ${paymentForm.contractNumber}`);

      // Reset payment form
      setPaymentForm({
        contractNumber: '',
        amountUsd: '',
        paymentMethod: 'Mobile Money (M-Pesa)',
        transactionRef: '',
      });

      refreshData();
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erreur d'enregistrement du paiement", "error");
    }
  };

  // Filter lists based on role (Admin and Operator see all records, Agent sees only his own)
  const canViewAll = activeAgentId === 'admin' || currentUser?.role === 'admin' || currentUser?.role === 'operator';

  const filteredClients = clients.filter(c => {
    const matchesSearch = `${c.lastName} ${c.firstName} ${c.phoneWhatsApp}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgent = canViewAll ? true : c.agentId === activeAgentId;
    return matchesSearch && matchesAgent;
  });

  const filteredContracts = contracts.filter(c => {
    const client = clients.find(cl => cl.id === c.clientId);
    const clientName = client ? `${client.lastName} ${client.firstName}` : '';
    const matchesSearch = `${c.contractNumber} ${clientName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgent = canViewAll ? true : c.agentId === activeAgentId;
    return matchesSearch && matchesAgent;
  });

  const filteredPayments = payments.filter(p => {
    const client = clients.find(cl => cl.id === p.clientId);
    const clientName = client ? `${client.lastName} ${client.firstName}` : '';
    const matchesSearch = `${p.contractNumber} ${p.transactionRef} ${clientName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgent = canViewAll ? true : p.agentId === activeAgentId;
    return matchesSearch && matchesAgent;
  });

  const filteredDelays = delays.filter(d => {
    const client = clients.find(cl => cl.id === d.clientId);
    const clientName = client ? `${client.lastName} ${client.firstName}` : '';
    const matchesSearch = `${d.contractNumber} ${clientName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const contract = contracts.find(co => co.contractNumber === d.contractNumber);
    const matchesAgent = canViewAll ? true : (contract?.agentId === activeAgentId);
    return matchesSearch && matchesAgent && d.status === 'Actif';
  });

  // Calculate Dashboard Metrics
  const activeContracts = contracts.filter(c => canViewAll ? true : c.agentId === activeAgentId);
  const totalEncaisse = payments
    .filter(p => p.status === 'Terminé' && (canViewAll ? true : p.agentId === activeAgentId))
    .reduce((acc, curr) => acc + curr.amountUsd, 0);

  const totalClientsCount = filteredClients.length;
  const activeContractsCount = activeContracts.filter(c => c.status === 'en_cours').length;
  const completedContractsCount = activeContracts.filter(c => c.status === 'termine').length;
  const blockedContractsCount = activeContracts.filter(c => c.status === 'bloque').length;
  const delayedContractsCount = activeContracts.filter(c => c.status === 'en_retard').length;

  // Calculate total credit value and remaining balance
  // Formula: Smartphone value - Total validated payments
  const totalPortfolioValue = activeContracts.reduce((acc, curr) => {
    const phone = smartphones.find(p => p.id === curr.smartphoneId);
    return acc + (phone ? phone.valueUsd : 0);
  }, 0);

  const totalRestant = totalPortfolioValue - totalEncaisse;

  // Helper to trigger direct print
  const handlePrintContract = () => {
    window.print();
  };

  // Direct, high-fidelity PDF Generation & Export bypassing print dialogs
  const handleExportPDF = async () => {
    if (!viewingContractDoc) return;
    const elementId = `contract-doc-${viewingContractDoc.contractNumber}`;
    const element = document.getElementById(elementId);
    if (!element) {
      showToast("Erreur : Document introuvable.", "error");
      return;
    }

    try {
      showToast("Génération du contrat PDF en cours...", "success");

      const canvas = await html2canvas(element, {
        scale: 2, // 2x density for superb print readability
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById(elementId);
          if (el) {
            el.style.width = '800px';
            el.style.height = 'auto';
            el.style.maxHeight = 'none';
            el.style.overflow = 'visible';
            el.style.padding = '40px';
            el.style.boxShadow = 'none';
            el.style.border = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');

      // Standard A4 dimensions in mm
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;

      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Render first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Render subsequent pages as sliced sections of the high resolution canvas
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 1. Direct download trigger
      try {
        pdf.save(`Contrat_AliMobile_${viewingContractDoc.contractNumber}.pdf`);
      } catch (saveErr) {
        console.warn("Direct download save error:", saveErr);
      }

      // 2. Blob fallback trigger (critical for iframe sandboxes which block automatic downloads)
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Contrat_AliMobile_${viewingContractDoc.contractNumber}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Open in a new window/tab so the user can easily print/save the high-res PDF directly
      setTimeout(() => {
        window.open(blobUrl, '_blank');
      }, 400);

      showToast("Contrat PDF généré et ouvert avec succès !", "success");
    } catch (err) {
      console.error("Erreur de génération PDF:", err);
      showToast("Impossible de générer le fichier PDF.", "error");
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <h2 className="text-white text-sm font-bold tracking-wider uppercase text-xs">Initialisation d'Ali Mobile...</h2>
      </div>
    );
  }

  if (!session) {
    return <LoginPage onLoginSuccess={(sess) => setSession(sess)} />;
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans relative selection:bg-orange-500/20 selection:text-orange-950 overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 px-4 py-3 rounded-none border shadow-2xl flex items-center space-x-3 max-w-sm bg-slate-900 text-white border-slate-800"
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            )}
            <span className="text-sm font-semibold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile sidebar drawer */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950 z-45 md:hidden no-print"
          />
        )}
      </AnimatePresence>

      {/* Left Navigation Sidebar - Sleek Interface (Desktop permanent, Mobile slide drawer) */}
      <aside className={`no-print bg-[#0F172A] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 h-screen overflow-y-auto rounded-none z-50 transition-transform duration-300
        fixed inset-y-0 left-0 w-64 md:static md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white border border-slate-700 flex items-center justify-center p-0.5 shrink-0">
                <img src="/logo_alimobile.jpeg" alt="Ali Mobile" className="w-full h-full object-contain" />
              </div>
            <span className="text-white font-bold text-xl tracking-tight">Ali Mobile</span>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-none transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow p-4 space-y-6">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-3 block">
            MENU DE SUIVI
          </span>
          <ul className="space-y-2">
            {[
              { id: 'dashboard', label: 'Tableau de bord', icon: TrendingUp },
              { id: 'contracts', label: currentUser?.role === 'operator' ? 'Contrats (Lecture)' : 'Voir ses clients', icon: Users },
              ...(currentUser?.role !== 'operator' ? [
                { id: 'new_contract', label: 'Créer un contrat', icon: PlusCircle },
                { id: 'new_payment', label: 'Ajouter un paiement', icon: Coins },
              ] : []),
              ...(currentUser?.role === 'operator' || currentUser?.role === 'admin' ? [
                { id: 'transactions', label: 'Transactions Utilités', icon: ArrowLeftRight, badge: transactions.length > 0 ? transactions.length : undefined },
              ] : []),
              { id: 'knox', label: 'Voir ses retards', icon: ShieldAlert, badge: filteredDelays.length > 0 ? filteredDelays.length : undefined },
              ...(currentUser?.role === 'admin' ? [
                { id: 'agents', label: 'Statistiques Agents', icon: Activity },
                { id: 'knox_stock', label: 'Stock Samsung Knox', icon: Database },
              ] : []),
              { id: 'settings', label: 'Paramètres', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setSelectedClientForDetails(null);
                      setSelectedContract(null);
                      setIsMobileSidebarOpen(false); // Auto close mobile sidebar
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-none text-sm transition-all duration-200 border ${isActive
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 border-transparent hover:text-white'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-orange-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-red-500 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-none">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Quick Stats sidebar footer with active agent info matching mockup */}
        <div
          onClick={() => {
            setActiveTab('profile');
            setSelectedClientForDetails(null);
            setSelectedContract(null);
            setIsMobileSidebarOpen(false);
          }}
          className="p-6 border-t border-slate-800 cursor-pointer hover:bg-slate-800/30 transition-all group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-slate-700 group-hover:bg-orange-500 transition-colors flex items-center justify-center font-bold text-white uppercase text-sm shadow-md">
              {activeAgentId === 'admin'
                ? (currentUser?.name?.split(' ').map(n => n[0]).join('') || 'AD')
                : agents.find(a => a.id === activeAgentId)?.name?.slice(0, 2) || 'AG'}
            </div>
            <div className="truncate flex-grow">
              <p className="text-sm font-semibold text-white truncate group-hover:text-orange-400 transition-colors">
                {activeAgentId === 'admin' ? (currentUser?.name || 'Administrateur') : agents.find(a => a.id === activeAgentId)?.name}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                {activeAgentId === 'admin' ? `Code: ${currentUser?.code || 'N/A'}` : `Agent: ${agents.find(a => a.id === activeAgentId)?.code}`}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Right side container - Header + independent scrolling Main Panel */}
      <div className="flex-grow flex flex-col h-screen overflow-hidden">
        {/* Top Header - Sleek Style matching Design HTML */}
        <header className="no-print h-20 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between px-4 md:px-8 z-40 shadow-sm rounded-none">
          {/* Logo visible on mobile - Clickable to open sidebar drawer with active agent info */}
          <div
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex md:hidden items-center gap-3 cursor-pointer group hover:opacity-80 transition select-none"
          >
            <div className="w-9 h-9 bg-white border border-slate-200 flex items-center justify-center p-0.5 shrink-0">
                <img src="/logo_alimobile.jpeg" alt="Ali Mobile" className="w-full h-full object-contain" />
              </div>
            <span className="text-slate-900 font-bold text-sm tracking-tight uppercase">Ali Mobile</span>
            <Menu className="w-5 h-5 text-slate-500 ml-1 group-hover:text-orange-500 transition" />
          </div>

          <div className="hidden md:block"></div>

          {/* User Session Switcher (Admin vs Agent) & Logout */}
          <div className="flex items-center space-x-2">
            {currentUser?.role === 'admin' ? (
              <div className="hidden">
                {/**<Briefcase className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
                <select 
                  value={activeAgentId} 
                  onChange={(e) => handleAgentChange(e.target.value)}
                  className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="admin" className="bg-white text-slate-800">⚙ Franck Alliance (Admin)</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id} className="bg-white text-slate-800">
                      👤 {a.name} ({a.code})
                    </option>
                  ))}
                </select>*/}
              </div>
            ) : (
              <div className="flex items-center bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-none text-xs font-semibold text-slate-800">
                <Briefcase className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
                <span>👤 {currentUser?.name} ({currentUser?.code})</span>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) console.error('Signout error:', error);
              }}
              className="flex items-center justify-center p-2 text-slate-500 hover:text-orange-500 hover:bg-slate-100 transition rounded-none border border-slate-200 cursor-pointer h-[32px] w-[32px]"
              title="Se déconnecter"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
            {currentUser?.role !== 'operator' ? (
              <button
                onClick={() => {
                  setActiveTab('new_contract');
                  setSelectedClientForDetails(null);
                  setSelectedContract(null);
                }}
                className="hidden sm:inline-block bg-orange-500 text-white px-5 py-2 rounded-none font-semibold text-xs shadow-md shadow-orange-500/20 hover:bg-orange-600 transition cursor-pointer"
              >
                Créer un contrat
              </button>
            ) : (
              <button
                onClick={() => {
                  setActiveTab('transactions');
                  setSelectedClientForDetails(null);
                  setSelectedContract(null);
                }}
                className="hidden sm:inline-block bg-orange-500 text-white px-5 py-2 rounded-none font-semibold text-xs shadow-md shadow-orange-500/20 hover:bg-orange-600 transition cursor-pointer"
              >
                Nouvelle Transaction
              </button>
            )}
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-grow flex flex-col overflow-y-auto bg-slate-50 p-4 md:p-8 rounded-none">

          {/* Inactivity Warning Banner (2 min before 30 min expiration) */}
          {showInactivityWarning && (
            <div className="mb-6 bg-amber-400 border border-amber-500 text-slate-950 px-4 py-3 font-bold text-xs flex items-center justify-between shadow-lg animate-pulse">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-slate-950 shrink-0" />
                <span>
                  Attention : Votre session expirera dans moins de 2 minutes pour inactivité. Cliquez ou effectuez une action pour rester connecté.
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-950 text-amber-300 font-black">
                Expiration 30 min
              </span>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="no-print space-y-8 max-w-7xl mx-auto w-full">
              {/* Header block with welcome and description */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-5">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight font-display text-slate-900 uppercase italic">
                    Aperçu du compte
                  </h1>
                  <p className="text-slate-500 text-xs mt-1 font-medium">
                    {activeAgentId === 'admin'
                      ? "Tableau de bord • Statistiques globales consolidées."
                      : `Tableau de bord • Agent agréé : ${agents.find(a => a.id === activeAgentId)?.name}`}
                  </p>
                </div>
                <div className="mt-3 md:mt-0 flex gap-2">
                  <button
                    onClick={() => setActiveTab('new_contract')}
                    className="bg-orange-500 text-white px-5 py-2.5 rounded-lg font-bold text-xs shadow-md shadow-orange-500/20 hover:bg-orange-600 transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Créer un contrat</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('new_payment')}
                    className="bg-[#0F172A] text-white hover:bg-slate-800 text-xs font-bold py-2.5 px-4 rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Ajouter un paiement</span>
                  </button>
                </div>
              </div>

              {/* Top Row: Key Performance Indicators styled after Sleek Interface */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                  { label: "Solde Encaissé", val: `${totalEncaisse.toLocaleString('fr-FR')}`, unit: "USD", desc: `${(totalEncaisse * USD_TO_CDF).toLocaleString('fr-FR')} CDF`, color: "text-emerald-600 bg-emerald-50/50 border-emerald-100", icon: Coins, detail: "Montant perçu à ce jour" },
                  { label: "Solde Restant", val: `${totalRestant.toLocaleString('fr-FR')}`, unit: "USD", desc: `${(totalRestant * USD_TO_CDF).toLocaleString('fr-FR')} CDF`, color: "text-orange-600 bg-orange-50/50 border-orange-100", icon: TrendingUp, detail: "Portefeuille à recouvrer" },
                  {
                    label: "Acheteurs OK", val: `${clients.filter(c => {
                      const cont = contracts.find(co => co.clientId === c.id);
                      return cont && cont.status === 'en_cours';
                    }).length}`, unit: "Clients", desc: "En ordre de paiement", color: "text-slate-700 bg-slate-100/50 border-slate-200", icon: UserCheck, detail: "Contrats en règle"
                  },
                  { label: "Retards & Bloqués", val: `${blockedContractsCount + delayedContractsCount}`, unit: "Alerte", desc: "Suspension Knox active", color: "text-red-600 bg-red-50/50 border-red-100", icon: BadgeAlert, detail: "Action requise" },
                  { label: "Finis / Acquis", val: `${completedContractsCount}`, unit: "Clôturés", desc: "Propriétaires à 100%", color: "text-indigo-600 bg-indigo-50/50 border-indigo-100", icon: CheckCircle, detail: "Contrats acquittés" },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-between min-h-[140px] hover:shadow-md transition duration-200">
                      <div className="absolute top-0 right-0 p-3 opacity-5 text-slate-900">
                        <Icon className="w-16 h-16" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                        <p className="text-3xl font-black text-slate-900 mt-2 font-display">
                          {stat.val} <span className="text-xs font-semibold text-slate-400 uppercase">{stat.unit}</span>
                        </p>
                      </div>
                      <div className="mt-4 flex flex-col text-[10px] text-slate-500 font-medium border-t border-slate-50 pt-2 font-mono">
                        <span className="text-slate-800 font-bold">{stat.desc}</span>
                        <span className="text-slate-400 text-[9px] mt-0.5">{stat.detail}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Second Row: Graphs & Agents Standings styled after Sleek Interface */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* SVG Graph 1: Recovery Status Portfolio split */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-xs uppercase font-bold tracking-wider text-slate-800 font-display">
                      État du portefeuille
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-slate-400">Recouvrement %</span>
                  </div>

                  {/* Custom horizontal stacked bar */}
                  {(() => {
                    const totalCount = contracts.length || 1;
                    const okPct = Math.round((activeContractsCount / totalCount) * 100);
                    const completedPct = Math.round((completedContractsCount / totalCount) * 100);
                    const lockedPct = Math.round(((blockedContractsCount + delayedContractsCount) / totalCount) * 100);

                    return (
                      <div className="space-y-4">
                        <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex text-[9px] font-bold text-center">
                          {okPct > 0 && <div className="bg-orange-500 text-white flex items-center justify-center transition-all shadow-[0_0_8px_rgba(249,115,22,0.5)]" style={{ width: `${okPct}%` }}>{okPct}%</div>}
                          {completedPct > 0 && <div className="bg-emerald-500 text-white flex items-center justify-center transition-all" style={{ width: `${completedPct}%` }}>{completedPct}%</div>}
                          {lockedPct > 0 && <div className="bg-red-500 text-white flex items-center justify-center transition-all" style={{ width: `${lockedPct}%` }}>{lockedPct}%</div>}
                        </div>

                        {/* Legend */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-1.5">
                              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full shrink-0"></span>
                              <span className="text-slate-500">Actifs en cours</span>
                            </div>
                            <span className="font-bold text-slate-800">{activeContractsCount} ({okPct}%)</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-1.5">
                              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0"></span>
                              <span className="text-slate-500">Acquis / Clôturés</span>
                            </div>
                            <span className="font-bold text-slate-800">{completedContractsCount} ({completedPct}%)</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-1.5">
                              <span className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0"></span>
                              <span className="text-slate-500">Suspendus Knox</span>
                            </div>
                            <span className="font-bold text-slate-800">{blockedContractsCount + delayedContractsCount} ({lockedPct}%)</span>
                          </div>
                        </div>

                        {/* Summary Rate */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">Efficacité Globale</span>
                            <span className="text-xl font-extrabold font-display text-emerald-600 mt-0.5 block">
                              {Math.round(((totalEncaisse) / (totalPortfolioValue || 1)) * 100)} %
                            </span>
                          </div>
                          <TrendingUp className="w-7 h-7 text-emerald-500/40" />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* SVG Graph 2: Sales Performance per Agent */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 lg:col-span-2">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-xs uppercase font-bold tracking-wider text-slate-800 font-display">
                      Performance des agents de terrain
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-slate-400">Total Encaissé ($)</span>
                  </div>

                  <div className="space-y-4">
                    {agents.map((agent) => {
                      const agentContracts = contracts.filter(c => c.agentId === agent.id);
                      const agentPayments = payments.filter(p => p.agentId === agent.id && p.status === 'Terminé');

                      const agentSalesVolume = agentContracts.reduce((acc, curr) => {
                        const phone = smartphones.find(p => p.id === curr.smartphoneId);
                        return acc + (phone ? phone.valueUsd : 0);
                      }, 0);

                      const agentCollected = agentPayments.reduce((acc, curr) => acc + curr.amountUsd, 0);
                      const maxCollected = Math.max(...agents.map(a => payments.filter(p => p.agentId === a.id && p.status === 'Terminé').reduce((ac, cu) => ac + cu.amountUsd, 0))) || 1;
                      const collectedPct = Math.min(Math.round((agentCollected / maxCollected) * 100), 100);

                      return (
                        <div key={agent.id} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-800">{agent.name} <span className="text-[10px] font-mono text-slate-400">({agent.code})</span></span>
                            <div className="text-right space-x-2">
                              <span className="text-slate-400 text-[11px]">Ventes: {agentSalesVolume.toFixed(0)} $</span>
                              <span className="text-orange-600 font-bold font-mono">Collecté: {agentCollected.toFixed(0)} $</span>
                            </div>
                          </div>
                          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-1000 shadow-[0_0_8px_rgba(249,115,22,0.3)]"
                              style={{ width: `${collectedPct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Quick Actions Grid matching the Sleek design HTML */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  onClick={() => setActiveTab('new_payment')}
                  className="bg-[#0F172A] text-white p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:bg-slate-800 transition-all group shadow-md"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500 transition-colors text-white">
                    <Coins className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold">Ajouter un paiement</span>
                </div>

                <div
                  onClick={() => setActiveTab('new_contract')}
                  className="bg-white p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 border border-slate-100 shadow-sm cursor-pointer hover:border-orange-200 transition-all group"
                >
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all text-orange-500">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Créer un contrat</span>
                </div>

                <div
                  onClick={() => setActiveTab('contracts')}
                  className="bg-white p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 border border-slate-100 shadow-sm cursor-pointer hover:border-orange-200 transition-all group"
                >
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all text-orange-500">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    Voir ses clients
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('knox')}
                  className="bg-white p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 border border-slate-100 shadow-sm cursor-pointer hover:border-orange-200 transition-all group"
                >
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all text-orange-500">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    Voir ses retards
                  </span>
                </div>
              </div>

              {/* Promo Section matching Sleek Interface design HTML */}
              <div className="relative h-48 rounded-3xl bg-gradient-to-r from-orange-600 to-amber-500 p-8 text-white overflow-hidden shadow-xl shadow-orange-500/30">
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-2xl font-black italic uppercase leading-none tracking-tight">Promotion Spéciale Ali Mobile</h3>
                    <p className="mt-2 text-orange-50 max-w-xl text-sm font-medium">Doublez votre volume Internet et recevez des minutes de communication gratuites pour chaque souscription de smartphone effectuée ce mois-ci. Offre réservée à nos clients à Bukavu.</p>
                  </div>
                  <div>
                    <button
                      onClick={() => setActiveTab('new_contract')}
                      className="bg-white text-orange-600 px-6 py-2.5 rounded-full font-extrabold text-xs shadow-lg active:scale-95 transition-transform cursor-pointer"
                    >
                      Souscrire maintenant
                    </button>
                  </div>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                  <TrendingUp className="w-64 h-64 text-white" />
                </div>
              </div>

              {/* Third Section: Recent Invoices / Transactions table (matching Starlink style shifted to white card) */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm uppercase font-bold tracking-wider text-slate-800 font-display">
                      Historique des factures et paiements récents
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Dernières transactions par Mobile Money et espèces à Bukavu.</p>
                  </div>
                  <div className="mt-2 sm:mt-0 flex space-x-2">
                    <input
                      type="text"
                      placeholder="Rechercher par n° de facture..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-50 text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-700 font-mono placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white w-64"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                        <th className="py-3 font-bold">Date de paiement</th>
                        <th className="py-3 font-bold">Client (Acheteur)</th>
                        <th className="py-3 font-bold">Contrat</th>
                        <th className="py-3 font-bold">N° de Facture / Réf</th>
                        <th className="py-3 font-bold">Méthode</th>
                        <th className="py-3 font-bold text-right">Total ($)</th>
                        <th className="py-3 font-bold text-right">Total (CDF)</th>
                        <th className="py-3 font-bold text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPayments.slice(0, 8).map((pay) => {
                        const client = clients.find(c => c.id === pay.clientId);
                        const isSuccess = pay.status === 'Terminé';

                        return (
                          <tr key={pay.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 text-slate-500">
                              {new Date(pay.date).toLocaleDateString('fr-FR')} {new Date(pay.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 font-semibold text-slate-800">
                              {client ? `${client.lastName} ${client.firstName}` : 'Inconnu'}
                            </td>
                            <td className="py-3 font-mono text-slate-600 font-bold">{pay.contractNumber}</td>
                            <td className="py-3 text-slate-500 font-mono text-[11px]">{pay.transactionRef}</td>
                            <td className="py-3 text-slate-500">{pay.paymentMethod}</td>
                            <td className="py-3 font-bold text-right text-slate-900">{pay.amountUsd.toFixed(2)} $</td>
                            <td className="py-3 font-mono text-right text-slate-500">{(pay.amountUsd * USD_TO_CDF).toLocaleString()} CDF</td>
                            <td className="py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${isSuccess
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                {pay.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Contracts & Clients Tab */}
          {activeTab === 'contracts' && (
            <div className="no-print space-y-6 max-w-7xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase italic">
                    Contrats de Financement Actifs
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">Liste complète des acheteurs, smartphones, et états de paiement.</p>
                </div>
                <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Chercher client, contrat..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 w-64 shadow-sm"
                    />
                  </div>
                  {currentUser?.role !== 'operator' && (
                    <button
                      onClick={handleExportContractsExcel}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      title="Exporter les contrats en format Excel .xlsx"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exporter .XLSX</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table of Contracts */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                        <th className="p-3">Numéro</th>
                        <th className="p-3">Client (Acheteur)</th>
                        <th className="p-3">Téléphone (WhatsApp)</th>
                        <th className="p-3">Smartphone acquis</th>
                        <th className="p-3 text-center">Plan de paiement</th>
                        <th className="p-3 text-right">Traite</th>
                        <th className="p-3 text-right">Acompte Initial</th>
                        <th className="p-3 text-center">État Knox Lock</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredContracts.map((contract) => {
                        const client = clients.find(c => c.id === contract.clientId);
                        const phone = smartphones.find(p => p.id === contract.smartphoneId);

                        return (
                          <tr key={contract.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 font-mono text-slate-800 font-bold">{contract.contractNumber}</td>
                            <td className="p-3">
                              {client ? (
                                <button
                                  onClick={() => setSelectedClientForDetails(client)}
                                  className="font-bold text-slate-800 hover:text-orange-500 hover:underline text-left block"
                                >
                                  {client.lastName} {client.firstName}
                                </button>
                              ) : 'Inconnu'}
                              <span className="text-[10px] text-slate-400 block mt-0.5">Souscrit le: {contract.subscriptionDate}</span>
                            </td>
                            <td className="p-3 font-mono text-slate-500">{client?.phoneWhatsApp || '-'}</td>
                            <td className="p-3 font-semibold text-slate-800">
                              {phone ? `${phone.brand} ${phone.model}` : 'Non spécifié'}
                              <span className="text-[10px] text-slate-400 block font-mono mt-0.5">IMEI: {phone?.imei}</span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="capitalize font-bold text-slate-700">
                                {contract.planType === 'hebdo' ? 'Hebdomadaire (8 sem.)' : 'Mensuel (2 mois)'}
                              </span>
                              <span className="text-[10px] text-red-500 font-semibold block mt-0.5">Échéance: {contract.paymentDay}</span>
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900">
                              {contract.installmentAmountUsd.toFixed(2)} $
                            </td>
                            <td className="p-3 text-right text-slate-500">
                              {contract.initialDepositUsd} $
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold ${contract.status === 'termine'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : contract.status === 'bloque'
                                  ? 'bg-red-50 text-red-700 border border-red-100 animate-pulse'
                                  : contract.status === 'en_retard'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : 'bg-orange-50 text-orange-700 border border-orange-100'
                                }`}>
                                {contract.status === 'termine' ? 'Smartphone Acquitté' :
                                  contract.status === 'bloque' ? '🔒 Knox Suspendu' :
                                    contract.status === 'en_retard' ? 'Retard de paiement' : 'En cours OK'}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                              {currentUser?.role === 'operator' ? (
                                <span className="text-[10px] text-slate-400 italic font-mono px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                                  Lecture seule
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setViewingContractDoc(contract)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 p-2 rounded-xl transition inline-flex items-center"
                                    title="Voir le contrat imprimable"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  {contract.status === 'bloque' && (
                                    <button
                                      onClick={() => setKnoxSimulatingContract(contract)}
                                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 p-2 rounded-xl transition inline-flex items-center"
                                      title="Ouvrir le simulateur de blocage"
                                    >
                                      <ShieldAlert className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setPaymentForm(prev => ({
                                        ...prev,
                                        contractNumber: contract.contractNumber,
                                        amountUsd: contract.installmentAmountUsd.toString()
                                      }));
                                      setActiveTab('new_payment');
                                    }}
                                    className="bg-orange-500 text-white hover:bg-orange-600 py-2 px-3 rounded-xl text-xs font-bold transition shadow-sm shadow-orange-500/20"
                                  >
                                    Payer
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* New Contract Subscription Form - EXACT physical fields */}
          {activeTab === 'new_contract' && (
            <div className="no-print space-y-6 max-w-3xl mx-auto w-full">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase italic">
                  Formulaire de Souscription Crédit
                </h1>
                <p className="text-xs text-slate-500 mt-1">Conforme aux champs EXACTS du contrat imprimable Ali Mobile.</p>
              </div>

              {/* Progress Stepper */}
              <div className="flex items-center justify-between bg-slate-100 p-3.5 rounded-2xl border border-slate-200 text-xs mb-4">
                <div className="flex items-center space-x-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-xs ${formStep === 1 ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-slate-200 text-slate-500'}`}>1</span>
                  <span className={formStep === 1 ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'}>Identification du Client</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <div className="flex items-center space-x-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-xs ${formStep === 2 ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-slate-200 text-slate-500'}`}>2</span>
                  <span className={formStep === 2 ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'}>Spécifications Financières</span>
                </div>
              </div>

              <form onSubmit={handleCreateContract} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 md:p-8 space-y-6">

                {formStep === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display border-b border-slate-100 pb-2">
                      1. Identification de l'Acheteur
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Nom (Obligatoire)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Kakule"
                          value={clientForm.lastName}
                          onChange={(e) => setClientForm(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 placeholder:text-slate-400 font-medium transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Postnom</label>
                        <input
                          type="text"
                          placeholder="Ex: Kasaki"
                          value={clientForm.middleName}
                          onChange={(e) => setClientForm(prev => ({ ...prev, middleName: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 placeholder:text-slate-400 font-medium transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Prénom (Obligatoire)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Samuel"
                          value={clientForm.firstName}
                          onChange={(e) => setClientForm(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 placeholder:text-slate-400 font-medium transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Téléphone principal (WhatsApp)</label>
                        <input
                          type="text"
                          required
                          placeholder="+243 997 123 456"
                          value={clientForm.phoneWhatsApp}
                          onChange={(e) => setClientForm(prev => ({ ...prev, phoneWhatsApp: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 placeholder:text-slate-400 font-mono transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Téléphone d'urgence</label>
                        <input
                          type="text"
                          required
                          placeholder="+243 ..."
                          value={clientForm.phoneUrgency}
                          onChange={(e) => setClientForm(prev => ({ ...prev, phoneUrgency: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 placeholder:text-slate-400 font-mono transition"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-widest block">Adresse physique à Bukavu</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">N°</label>
                          <input
                            type="text"
                            required
                            placeholder="17"
                            value={clientForm.addressNum}
                            onChange={(e) => setClientForm(prev => ({ ...prev, addressNum: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-lg text-sm p-2 focus:outline-none focus:border-orange-500 transition"
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Avenue</label>
                          <input
                            type="text"
                            required
                            placeholder="des Écoles"
                            value={clientForm.addressAvenue}
                            onChange={(e) => setClientForm(prev => ({ ...prev, addressAvenue: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-lg text-sm p-2 focus:outline-none focus:border-orange-500 transition"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Quartier</label>
                          <input
                            type="text"
                            required
                            placeholder="Himbi, Les Volcans..."
                            value={clientForm.neighborhood}
                            onChange={(e) => setClientForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-lg text-sm p-2 focus:outline-none focus:border-orange-500 transition"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Commune / Ville (Obligatoire)</label>
                        <input
                          type="text"
                          required
                          placeholder="Bukavu, Bukavu, etc."
                          value={clientForm.cityCommune}
                          onChange={(e) => setClientForm(prev => ({ ...prev, cityCommune: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-lg text-sm p-2 focus:outline-none focus:border-orange-500 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Pièce d'identité fournie</label>
                        <select
                          value={clientForm.identityDocType}
                          onChange={(e) => setClientForm(prev => ({ ...prev, identityDocType: e.target.value as any }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-3 focus:outline-none focus:border-orange-500 focus:bg-white cursor-pointer text-slate-800 font-semibold"
                        >
                          <option value="Carte d'électeur" className="bg-white">Carte d'électeur</option>
                          <option value="Passeport" className="bg-white">Passeport</option>
                          <option value="Permis de conduire" className="bg-white">Permis de conduire</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Numéro de la pièce (Obligatoire)</label>
                        <input
                          type="text"
                          required
                          placeholder="ELEC-243-XXXX"
                          value={clientForm.identityDocNum}
                          onChange={(e) => setClientForm(prev => ({ ...prev, identityDocNum: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 placeholder:text-slate-400 font-mono transition"
                        />
                      </div>
                    </div>

                    {/* Photo de la pièce d'identité */}
                    <div className="border-t border-slate-100 pt-3">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1.5">
                        Photo de la pièce d'identité (Requis pour validation)
                      </label>

                      {!clientForm.identityCardPhoto ? (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingPhoto(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDraggingPhoto(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingPhoto(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handlePhotoUpload(e.dataTransfer.files[0]);
                            }
                          }}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center cursor-pointer ${isDraggingPhoto
                            ? 'border-orange-500 bg-orange-50/50'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                            }`}
                          onClick={() => document.getElementById('identity-photo-file-input')?.click()}
                        >
                          <input
                            type="file"
                            id="identity-photo-file-input"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handlePhotoUpload(e.target.files[0]);
                              }
                            }}
                          />
                          <Upload className="w-8 h-8 text-slate-400 mb-2" />
                          <span className="text-sm font-bold text-slate-700 block">
                            Glisser-déposer ou cliquer pour ajouter la photo de la pièce
                          </span>
                          <span className="text-xs text-slate-400 block mt-1">
                            Formats JPG, PNG, WEBP acceptés (Max 5Mo)
                          </span>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center space-x-3.5 w-full sm:w-auto">
                            <div className="w-16 h-12 bg-white rounded-lg border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                              <img
                                src={clientForm.identityCardPhoto}
                                alt="Aperçu pièce"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-left truncate max-w-[200px] sm:max-w-[300px]">
                              <span className="text-sm font-bold text-slate-800 block truncate">
                                Piece_Identite_{clientForm.lastName || 'Client'}.png
                              </span>
                              <span className="text-xs text-emerald-600 font-bold flex items-center">
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Document chargé avec succès
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setClientForm(prev => ({ ...prev, identityCardPhoto: '' }))}
                            className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/50 px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Supprimer la photo</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setFormStep(2)}
                        disabled={!clientForm.lastName || !clientForm.firstName || !clientForm.phoneWhatsApp || !clientForm.identityDocNum || !clientForm.identityCardPhoto}
                        className="bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 font-bold py-3 px-8 rounded-xl transition shadow-md shadow-orange-500/20 active:scale-98 cursor-pointer"
                      >
                        Suivant : Smartphone & Plan de Paiement
                      </button>
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display border-b border-slate-100 pb-2">
                      2. Spécifications du Smartphone et Plan Financier
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Sélectionner un Smartphone</label>
                        <select
                          required
                          value={contractForm.smartphoneId}
                          onChange={(e) => handleSmartphoneSelect(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-3 focus:outline-none focus:border-orange-500 focus:bg-white cursor-pointer text-slate-800 font-bold"
                        >
                          <option value="">-- Choisir dans le stock Samsung Knox --</option>
                          {smartphones.map(p => (
                            <option key={p.id} value={p.id} className="bg-white">
                              {p.brand} {p.model} - Valeur {p.valueUsd} $
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Saisir / Scanner IMEI (Recherche Auto)</label>
                        <input
                          type="text"
                          required
                          maxLength={15}
                          placeholder="Saisir l'IMEI à 15 chiffres..."
                          value={contractForm.imeiInput}
                          onChange={(e) => handleImeiChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-3 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 font-mono text-center font-bold transition"
                        />
                        {contractForm.smartphoneId ? (
                          <span className="text-[10px] text-emerald-600 font-bold mt-1 block text-center">
                            ✓ Appareil identifié : {smartphones.find(p => p.id === contractForm.smartphoneId)?.brand} {smartphones.find(p => p.id === contractForm.smartphoneId)?.model} ({smartphones.find(p => p.id === contractForm.smartphoneId)?.valueUsd} $)
                          </span>
                        ) : contractForm.imeiInput.length > 0 ? (
                          <span className="text-[10px] text-amber-600 font-semibold mt-1 block text-center">
                            🔍 Recherche de l'IMEI dans le stock...
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Choix de la Formule</label>
                        <div className="flex items-center space-x-4 mt-2">
                          <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer font-semibold">
                            <input
                              type="radio"
                              name="planType"
                              value="hebdo"
                              checked={contractForm.planType === 'hebdo'}
                              onChange={() => handlePlanTypeChange('hebdo')}
                              className="text-orange-500 focus:ring-orange-500 border-slate-300 bg-white h-4 w-4"
                            />
                            <span>Formule HEBDOMADAIRE</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer font-semibold">
                            <input
                              type="radio"
                              name="planType"
                              value="mensuel"
                              checked={contractForm.planType === 'mensuel'}
                              onChange={() => handlePlanTypeChange('mensuel')}
                              className="text-orange-500 focus:ring-orange-500 border-slate-300 bg-white h-4 w-4"
                            />
                            <span>Formule MENSUELLE</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                          Nombre d'échéances ({contractForm.planType === 'hebdo' ? 'Semaines' : 'Mois'})
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="100"
                          value={contractForm.totalInstallments}
                          onChange={(e) => handleTotalInstallmentsChange(parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 font-mono text-center font-bold transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Acompte Initial (Saisie Libre)</label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="0"
                            value={contractForm.initialDepositUsd || ''}
                            onChange={(e) => handleInitialDepositChange(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 text-slate-800 font-mono font-bold text-center focus:outline-none focus:border-orange-500 focus:bg-white transition"
                          />
                          <span className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                        </div>
                        {contractForm.smartphoneId && (
                          <div className="text-center mt-1 space-y-0.5">
                            <span className="text-[10px] text-slate-500 block font-semibold">
                              {(contractForm.initialDepositUsd * USD_TO_CDF).toLocaleString()} CDF payés ce jour
                            </span>
                            <span className="text-[10px] text-orange-600 font-bold block">
                              Soit {((contractForm.initialDepositUsd / (smartphones.find(p => p.id === contractForm.smartphoneId)?.valueUsd || 1)) * 100).toFixed(0)}% de la valeur
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Montant de la traite (Calculé)</label>
                        <div className="relative">
                          <input
                            type="number"
                            readOnly
                            value={contractForm.installmentAmountUsd}
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 text-slate-800 font-mono font-bold text-center"
                          />
                          <span className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                        </div>
                        <span className="text-[10px] text-red-500 text-center block mt-1 font-bold">Par {contractForm.planType === 'hebdo' ? 'semaine' : 'mois'}</span>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Jour de paiement fixe</label>
                        <input
                          type="text"
                          required
                          value={contractForm.paymentDay}
                          onChange={(e) => setContractForm(prev => ({ ...prev, paymentDay: e.target.value }))}
                          placeholder={contractForm.planType === 'hebdo' ? 'Samedi' : 'Ex: 05 de chaque mois'}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 font-bold text-center transition"
                        />
                        <span className="text-[9px] text-slate-400 block text-center mt-1 font-semibold">Verrouillage automatique J+1 si retard</span>
                      </div>
                    </div>

                    <div className="bg-red-50 p-4 border border-red-100 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2 text-red-700 font-bold">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="text-xs uppercase font-extrabold font-display">Règles Strictes de Sécurité Knox</span>
                      </div>
                      <p className="text-[11px] text-red-900 leading-relaxed font-medium">
                        Le smartphone est enregistré sur le serveur de gestion Knox de Samsung. Tout non-paiement au jour fixé entraînera la coupure totale de l'appareil le lendemain à <span className="font-bold text-red-950 font-mono">08h00</span>. Le déblocage s'effectue automatiquement par Internet dans les 2 minutes suivant la réception du paiement Mobile Money.
                      </p>
                    </div>

                    <div className="pt-4 flex justify-between border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setFormStep(1)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition"
                      >
                        Retour
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition flex items-center space-x-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                      >
                        <span>Créer & Enregistrer le Contrat</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* New Payment Entry Form */}
          {activeTab === 'new_payment' && (
            <div className="no-print space-y-6 max-w-xl mx-auto w-full">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase italic">
                  Ajouter un paiement
                </h1>
                <p className="text-xs text-slate-500 mt-1">Enregistrer la réception d'un paiement Mobile Money ou espèces.</p>
              </div>

              <form onSubmit={handleCreatePayment} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 md:p-8 space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">N° de Contrat (Ex: AM-2026-001)</label>
                  <select
                    required
                    value={paymentForm.contractNumber}
                    onChange={(e) => {
                      const num = e.target.value;
                      const cont = contracts.find(c => c.contractNumber === num);
                      setPaymentForm(prev => ({
                        ...prev,
                        contractNumber: num,
                        amountUsd: cont ? cont.installmentAmountUsd.toString() : ''
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-3 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 font-bold"
                  >
                    <option value="">-- Choisir le contrat à encaisser --</option>
                    {contracts.filter(c => c.status !== 'termine').map(c => {
                      const cl = clients.find(clt => clt.id === c.clientId);
                      return (
                        <option key={c.id} value={c.contractNumber} className="bg-white text-slate-800">
                          {c.contractNumber} — {cl ? `${cl.lastName} ${cl.firstName}` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Montant perçu (USD)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="21.25"
                        value={paymentForm.amountUsd}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amountUsd: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 font-mono text-lg font-bold transition"
                      />
                      <span className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
                    </div>
                    {paymentForm.amountUsd && (
                      <span className="text-[10px] text-slate-500 block mt-1 font-mono font-bold">
                        Équivalent: {(parseFloat(paymentForm.amountUsd) * USD_TO_CDF).toLocaleString()} CDF
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Méthode de paiement</label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-3 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 font-bold"
                    >
                      <option value="Mobile Money (M-Pesa)" className="bg-white">Mobile Money (M-Pesa)</option>
                      <option value="Mobile Money (Airtel Money)" className="bg-white">Mobile Money (Airtel Money)</option>
                      <option value="Mobile Money (Orange Money)" className="bg-white">Mobile Money (Orange Money)</option>
                      <option value="Espèces" className="bg-white">Espèces (Guichet)</option>
                      <option value="Carte" className="bg-white">Carte bancaire</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Référence de transaction / Message ID</label>
                  <input
                    type="text"
                    placeholder="Ex: MP-TRX-XXXXXX"
                    value={paymentForm.transactionRef}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionRef: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 font-mono font-bold transition"
                  />
                  <span className="text-[9px] text-slate-400 block mt-1 font-semibold">Requis pour rapprochement automatique dans Knox.</span>
                </div>

                <div className="bg-emerald-50 p-4 border border-emerald-100 rounded-2xl text-[11px] text-emerald-800 leading-relaxed font-semibold">
                  💡 L'enregistrement immédiat d'un paiement valide lèvera instantanément le statut de blocage Knox de l'appareil client sous un délai de 2 minutes.
                </div>

                <div className="pt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition text-xs cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    Confirmer le Paiement
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Knox Lock & Overdues Tab */}
          {activeTab === 'knox' && (
            <div className="no-print space-y-6 max-w-7xl mx-auto w-full">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase italic flex items-center">
                  <ShieldAlert className="w-6 h-6 text-red-600 mr-2 shrink-0 animate-pulse" />
                  <span>Retards de Paiement & Knox Lock™ Simulator</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Suivi des téléphones suspendus à J+1. Cliquez sur un client pour lancer le simulateur Knox interactif de son appareil !
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* List of active delays */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-3">
                    <h3 className="text-xs uppercase font-bold tracking-wider text-slate-800 font-display pb-2 border-b border-slate-50">
                      Portefeuille des clients en retard actif
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                            <th className="p-2">Contrat</th>
                            <th className="p-2">Client (Acheteur)</th>
                            <th className="p-2 text-right">Échéance due</th>
                            <th className="p-2 text-center">Jours de Retard</th>
                            <th className="p-2 text-right">Solde dû ($)</th>
                            <th className="p-2 text-center">Statut Knox</th>
                            <th className="p-2 text-right">Bypass</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredDelays.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-6 text-slate-400 font-bold italic">
                                Aucun retard de paiement actif détecté. Tous les clients sont en ordre !
                              </td>
                            </tr>
                          ) : (
                            filteredDelays.map((delay) => {
                              const client = clients.find(c => c.id === delay.clientId);
                              const contract = contracts.find(c => c.contractNumber === delay.contractNumber);

                              return (
                                <tr
                                  key={delay.id}
                                  className={`hover:bg-slate-50 transition cursor-pointer ${knoxSimulatingContract?.contractNumber === delay.contractNumber ? 'bg-orange-50/50' : ''}`}
                                  onClick={() => {
                                    if (contract) setKnoxSimulatingContract(contract);
                                  }}
                                >
                                  <td className="p-2 font-mono text-slate-800 font-bold">{delay.contractNumber}</td>
                                  <td className="p-2 font-bold text-slate-800">
                                    {client ? `${client.lastName} ${client.firstName}` : 'Inconnu'}
                                  </td>
                                  <td className="p-2 text-right text-slate-500 font-mono font-semibold">{delay.dueDate}</td>
                                  <td className="p-2 text-center">
                                    <span className="font-bold text-red-600 bg-red-50 border border-red-100 rounded-full px-2.5 py-0.5 text-[10px]">
                                      {delay.daysOverdue} jours
                                    </span>
                                  </td>
                                  <td className="p-2 text-right font-bold text-slate-900 font-mono">{delay.amountUsd.toFixed(2)} $</td>
                                  <td className="p-2 text-center">
                                    <span className="text-red-600 font-bold flex items-center justify-center space-x-1">
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>BLOQUÉ</span>
                                    </span>
                                  </td>
                                  <td className="p-2 text-right">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (contract) setKnoxSimulatingContract(contract);
                                      }}
                                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] py-1 px-3 rounded-lg transition shadow-sm shadow-orange-500/10 cursor-pointer"
                                    >
                                      Simuler
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Visual explanation block */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs leading-relaxed text-slate-600">
                    <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">L'INFRASTRUCTURE DE SÉCURITÉ KNOX</span>
                    <p>
                      ALI MOBILE s'appuie sur la technologie Knox de Samsung pour assurer un financement à faible risque. Lorsqu'un retard est constaté à J+1 (chaque dimanche matin à 08h00 pour les formules hebdomadaires), le système envoie une commande de verrouillage.
                    </p>
                    <p>
                      Le smartphone n'est plus utilisable, sauf pour passer un appel d'urgence au support d'ALI MOBILE au <span className="font-bold text-slate-900 font-mono">+243 824 444 298</span> ou initier une transaction de paiement. Dès que le paiement est reçu, l'appareil se déverrouille automatiquement en 2 minutes par synchronisation réseau.
                    </p>
                  </div>
                </div>

                {/* Right Interactive Simulator Screen */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col items-center">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-800 font-display border-b border-slate-50 pb-3 w-full text-center mb-4">
                    📱 Simulateur d'Écran Knox Lock
                  </h3>

                  {knoxSimulatingContract ? (
                    (() => {
                      const client = clients.find(c => c.id === knoxSimulatingContract.clientId);
                      const phone = smartphones.find(p => p.id === knoxSimulatingContract.smartphoneId);
                      if (client && phone) {
                        return (
                          <KnoxSimulator
                            contract={knoxSimulatingContract}
                            client={client}
                            smartphone={phone}
                            onUnlockSuccess={() => {
                              showToast("Synchronisation Knox réussie. Téléphone débloqué !");
                              refreshData();
                            }}
                          />
                        );
                      }
                      return null;
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3 text-center">
                      <PhoneIcon className="w-12 h-12 stroke-1 text-slate-300" />
                      <p className="text-xs max-w-[200px] font-medium leading-relaxed">
                        Veuillez sélectionner un contrat en retard dans le tableau de gauche pour simuler son écran Knox Lock.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Agents Statistics Tab */}
          {activeTab === 'agents' && (
            <div className="no-print space-y-6 max-w-7xl mx-auto w-full">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase italic">
                  Performance & Statistiques des Agents de Vente
                </h1>
                <p className="text-xs text-slate-500 mt-1">Suivi de l'efficacité, volume de contrats générés et taux de recouvrement.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {agents.map((agent) => {
                  const agentContracts = contracts.filter(c => c.agentId === agent.id);
                  const agentPayments = payments.filter(p => p.agentId === agent.id && p.status === 'Terminé');

                  const totalSales = agentContracts.reduce((acc, curr) => {
                    const phone = smartphones.find(p => p.id === curr.smartphoneId);
                    return acc + (phone ? phone.valueUsd : 0);
                  }, 0);

                  const totalCollected = agentPayments.reduce((acc, curr) => acc + curr.amountUsd, 0);
                  const activeCount = agentContracts.filter(c => c.status === 'en_cours').length;
                  const completedCount = agentContracts.filter(c => c.status === 'termine').length;
                  const blockedCount = agentContracts.filter(c => c.status === 'bloque' || c.status === 'en_retard').length;

                  // 5% standard commission on collected funds
                  const commission = totalCollected * 0.05;

                  return (
                    <div key={agent.id} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-4">
                      {/* Agent Profile Header */}
                      <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-3">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center font-bold text-lg text-orange-600">
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{agent.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{agent.code} — {agent.phone}</span>
                        </div>
                      </div>

                      {/* Agent Metrics Grid */}
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold">Ventes totales</span>
                          <span className="text-sm font-bold block text-slate-800 font-mono mt-0.5">{totalSales.toFixed(0)} $</span>
                        </div>
                        <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50">
                          <span className="text-[9px] text-emerald-600 block uppercase font-mono font-bold">Commission (5%)</span>
                          <span className="text-sm font-bold block text-emerald-700 font-mono mt-0.5">{commission.toFixed(2)} $</span>
                        </div>
                      </div>

                      {/* Contract status breakdown */}
                      <div className="space-y-2 text-xs">
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Portefeuille contrats</span>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-semibold">Actifs en règle :</span>
                          <span className="font-bold text-slate-800 font-mono">{activeCount}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-semibold">Abonnements acquittés :</span>
                          <span className="font-bold text-emerald-600 font-mono">{completedCount}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-semibold">En retard / Bloqués :</span>
                          <span className="font-bold text-red-500 font-mono">{blockedCount}</span>
                        </div>
                      </div>

                      {/* Collection Progress bar */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                          <span>Taux de recouvrement :</span>
                          <span className="text-emerald-600 font-mono font-bold">
                            {totalSales > 0 ? Math.round((totalCollected / totalSales) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${totalSales > 0 ? Math.round((totalCollected / totalSales) * 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock Samsung Knox Tab */}
          {activeTab === 'knox_stock' && (
            <div className="no-print space-y-6 max-w-6xl mx-auto w-full">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase italic">
                  Stock Samsung Knox
                </h1>
                <p className="text-xs text-slate-500 mt-1">Enregistrement des nouveaux appareils de la boutique Ali Mobile et suivi d'intégration dans l'application Samsung Knox.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 border border-slate-100 rounded-3xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Appareils en Stock</span>
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                      <PhoneIcon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-slate-900 font-mono">{smartphones.length}</span>
                    <span className="text-xs text-slate-500">unités</span>
                  </div>
                </div>

                <div className="bg-white p-5 border border-slate-100 rounded-3xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Disponibles à la Vente</span>
                    <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-emerald-600 font-mono">
                      {smartphones.filter(p => !contracts.some(c => c.smartphoneId === p.id && c.status !== 'termine')).length}
                    </span>
                    <span className="text-xs text-slate-500">unités</span>
                  </div>
                </div>

                <div className="bg-white p-5 border border-slate-100 rounded-3xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Valeur Totale Stock</span>
                    <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
                      <Coins className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-orange-500 font-mono">
                      {smartphones.reduce((acc, curr) => acc + curr.valueUsd, 0).toLocaleString()} $
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      (~{(smartphones.reduce((acc, curr) => acc + curr.valueUsd, 0) * USD_TO_CDF).toLocaleString()} CDF)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form to add device */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 h-fit space-y-4">
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight font-display border-b border-slate-50 pb-2">
                    Ajouter un Terminal
                  </h3>
                  <form onSubmit={handleAddSmartphoneToStock} className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Marque</label>
                      <input
                        type="text"
                        required
                        value={newPhoneBrand}
                        onChange={(e) => setNewPhoneBrand(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 font-bold transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Modèle de Smartphone</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Galaxy A35 5G"
                        value={newPhoneModel}
                        onChange={(e) => setNewPhoneModel(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 font-semibold transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Valeur Marchande (USD)</label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Ex: 340"
                          value={newPhoneValue}
                          onChange={(e) => setNewPhoneValue(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 font-mono font-bold transition"
                        />
                        <span className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Code IMEI unique (15 chiffres)</label>
                      <input
                        type="text"
                        required
                        maxLength={15}
                        placeholder="Ex: 358901110587213"
                        value={newPhoneImei}
                        onChange={(e) => setNewPhoneImei(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 font-mono font-bold tracking-wider transition"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-xl transition hover:bg-orange-600 shadow-md shadow-orange-500/10 active:scale-98 flex items-center justify-center space-x-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>Ajouter au Stock</span>
                    </button>
                  </form>
                </div>

                {/* Stock table list */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight font-display">
                      Inventaire des Appareils Knox
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 font-mono font-bold">
                      TOTAL : {smartphones.length} Appareils
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-500">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px] font-bold font-display">
                          <th className="py-3 px-2">Terminal</th>
                          <th className="py-3 px-2">Code IMEI</th>
                          <th className="py-3 px-2">Valeur USD</th>
                          <th className="py-3 px-2">Statut Intégration</th>
                          <th className="py-3 px-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {smartphones.map(phone => {
                          const activeContract = contracts.find(c => c.smartphoneId === phone.id && c.status !== 'termine');
                          const clientObj = activeContract ? clients.find(cl => cl.id === activeContract.clientId) : null;
                          const clientName = clientObj ? `${clientObj.lastName} ${clientObj.firstName}` : null;

                          return (
                            <tr key={phone.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 px-2 font-bold text-slate-800">
                                {phone.brand} {phone.model}
                              </td>
                              <td className="py-3 px-2 font-mono font-medium text-slate-600">
                                {phone.imei}
                              </td>
                              <td className="py-3 px-2 font-mono font-bold text-slate-950">
                                {phone.valueUsd} $
                              </td>
                              <td className="py-3 px-2">
                                {activeContract ? (
                                  <div className="space-y-0.5">
                                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 text-[10px] rounded-none inline-block border border-slate-200">
                                      Engagé (Contrat {activeContract.contractNumber})
                                    </span>
                                    {clientName && (
                                      <span className="text-[10px] text-slate-400 block font-medium truncate max-w-[150px]">
                                        Client: {clientName}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 text-[10px] rounded-none inline-block border border-emerald-100">
                                    Disponible en Stock
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSmartphoneFromStock(phone.id)}
                                  disabled={!!activeContract}
                                  className={`p-2 rounded-lg transition-all ${activeContract
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer'
                                    }`}
                                  title={activeContract ? "Impossible de supprimer un appareil sous contrat actif" : "Supprimer du stock"}
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings / Configuration Tab */}
          {activeTab === 'settings' && (
            <div className="no-print space-y-6 max-w-6xl mx-auto w-full animate-fadeIn pb-12">
              <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase italic flex items-center">
                    <Settings className="w-6 h-6 mr-2 text-orange-500" />
                    <span>Paramètres & Administration</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Gestion des utilisateurs, attribution des rôles, sécurité des accès et diagnostic système.
                  </p>
                </div>

                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => setShowCreateUserModal(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-none text-xs uppercase tracking-wider transition flex items-center space-x-2 cursor-pointer shadow-none shrink-0 self-start md:self-auto"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Nouvel Utilisateur</span>
                  </button>
                )}
              </div>

              {/* SECTION 1: User Management (Admin Only) */}
              {currentUser?.role === 'admin' ? (
                <div className="bg-white border border-slate-200 shadow-sm rounded-none overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display flex items-center">
                        <Users className="w-4 h-4 mr-2 text-orange-500" />
                        <span>Gestion des Comptes Utilisateurs & Rôles</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Attribuez des rôles (Admin, Opérateur, Agent), réinitialisez les mots de passe et gérez les accès.
                      </p>
                    </div>

                    {/* Filter and Search */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          placeholder="Rechercher nom, email, code, ville..."
                          className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-none focus:outline-none focus:border-orange-500 w-full sm:w-56 font-medium text-slate-800 placeholder:text-slate-400"
                        />
                      </div>
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value as any)}
                        className="text-xs bg-white border border-slate-200 rounded-none px-3 py-1.5 focus:outline-none focus:border-orange-500 font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="all">Tous les rôles ({agents.length})</option>
                        <option value="admin">Administrateurs ({agents.filter(a => a.role === 'admin').length})</option>
                        <option value="operator">Opérateurs Utilités ({agents.filter(a => a.role === 'operator').length})</option>
                        <option value="agent">Agents de Vente ({agents.filter(a => a.role === 'agent' || !a.role).length})</option>
                      </select>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold font-display bg-slate-50/70">
                          <th className="py-3 px-4">Utilisateur / Identifiant</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">Ville</th>
                          <th className="py-3 px-4">Rôle Attribué</th>
                          <th className="py-3 px-4 text-center">Sécurité Mot de Passe</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {agents
                          .filter(a => {
                            const term = userSearchTerm.toLowerCase();
                            const matchesSearch =
                              a.name.toLowerCase().includes(term) ||
                              a.email.toLowerCase().includes(term) ||
                              a.code.toLowerCase().includes(term) ||
                              (a.city && a.city.toLowerCase().includes(term));
                            const role = a.role || 'agent';
                            const matchesRole = userRoleFilter === 'all' || role === userRoleFilter;
                            return matchesSearch && matchesRole;
                          })
                          .map((agent) => {
                            const isCurrentUser = agent.id === currentUser?.id;
                            const role = agent.role || 'agent';
                            const roleBadgeColor =
                              role === 'admin'
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : role === 'operator'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                            return (
                              <tr key={agent.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-none flex items-center justify-center font-bold text-xs uppercase text-white shadow-none ${
                                      role === 'admin' ? 'bg-gradient-to-tr from-orange-600 to-amber-500' :
                                      role === 'operator' ? 'bg-gradient-to-tr from-blue-600 to-indigo-500' :
                                      'bg-gradient-to-tr from-emerald-600 to-teal-500'
                                    }`}>
                                      {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div>
                                      <div className="flex items-center space-x-1.5">
                                        <span className="font-bold text-slate-900">{agent.name}</span>
                                        {isCurrentUser && (
                                          <span className="bg-slate-900 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-none">
                                            Vous
                                          </span>
                                        )}
                                      </div>
                                      <span className="font-mono text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded-none border border-slate-200 inline-block mt-0.5">
                                        {agent.code}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="space-y-0.5 font-mono">
                                    <span className="text-slate-800 font-medium block text-xs">{agent.email}</span>
                                    <span className="text-[11px] text-slate-400 block">{agent.phone}</span>
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <span className="inline-flex items-center text-slate-700 font-semibold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-none text-xs">
                                    <MapPin className="w-3 h-3 mr-1 text-orange-500" />
                                    <span>{agent.city || 'Goma'}</span>
                                  </span>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-2">
                                    <select
                                      value={role}
                                      disabled={isCurrentUser || isProcessingUserAction}
                                      onChange={(e) => handleUpdateAgentRole(agent, e.target.value as any)}
                                      className={`text-xs font-bold px-2.5 py-1 rounded-none border transition cursor-pointer ${roleBadgeColor} ${
                                        isCurrentUser ? 'opacity-80 cursor-not-allowed' : 'hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500'
                                      }`}
                                      title={isCurrentUser ? "Vous ne pouvez pas modifier votre propre rôle" : "Changer le rôle"}
                                    >
                                      <option value="agent">Agent de Vente</option>
                                      <option value="operator">Opérateur Utilités</option>
                                      <option value="admin">Administrateur</option>
                                    </select>
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setResetPasswordAgent(agent)}
                                    className="inline-flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-none text-[11px] font-bold uppercase tracking-wider transition cursor-pointer"
                                    title="Réinitialiser ou envoyer le lien de mot de passe"
                                  >
                                    <Key className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Gérer le mot de passe</span>
                                  </button>
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditAgent(agent)}
                                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-none transition cursor-pointer border border-transparent hover:border-slate-200"
                                      title="Modifier les coordonnées"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isCurrentUser || isProcessingUserAction}
                                      onClick={() => setDeleteAgentConfirm(agent)}
                                      className={`p-1.5 rounded-none transition border border-transparent ${
                                        isCurrentUser
                                          ? 'text-slate-200 cursor-not-allowed'
                                          : 'text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-100 cursor-pointer'
                                      }`}
                                      title={isCurrentUser ? "Impossible de supprimer votre propre compte" : "Supprimer l'utilisateur"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-none p-6 text-center text-slate-500 space-y-2 text-xs">
                  <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700 uppercase tracking-wider">Privilèges restreints</p>
                  <p className="max-w-md mx-auto">
                    La gestion des utilisateurs, l'attribution des rôles et la réinitialisation des mots de passe sont réservées aux administrateurs.
                  </p>
                </div>
              )}

              {/* SECTION 2: Knox integration diagnostics & DB reset */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Knox integration diagnostics */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-none p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-display flex items-center">
                    <Database className="w-4 h-4 mr-2 text-orange-500" />
                    <span>État de l'intégration Samsung Knox API</span>
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-none border border-slate-200 text-xs space-y-3 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Statut du serveur de licence :</span>
                      <span className="text-emerald-700 font-bold flex items-center space-x-1.5 bg-emerald-50 px-2 py-0.5 rounded-none border border-emerald-200 text-[10px]">
                        <span className="w-2 h-2 rounded-none bg-emerald-500 inline-block animate-pulse"></span>
                        <span>OPÉRATIONNEL (CLOUD)</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Version du SDK Ali Knox Controller :</span>
                      <span className="font-mono text-slate-800 font-bold">v4.18.26-GOMA</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Rapprochement Mobile Money :</span>
                      <span className="text-orange-600 font-semibold font-mono text-[11px]">M-Pesa, Airtel Money, Orange Money (LIVE)</span>
                    </div>
                  </div>
                </div>

                {/* Database Reset Action */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-none p-5 space-y-4">
                  <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider font-display">
                    Zone de Danger
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    La réinitialisation de la base de données effacera tous les clients, contrats et paiements créés par vos agents au cours de cette session de simulation, et restaurera le jeu de données d'origine d'Ali Mobile Goma.
                  </p>

                  {!showResetConfirm ? (
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2.5 px-4 rounded-none text-xs font-bold uppercase tracking-wider transition flex items-center space-x-2 cursor-pointer shadow-none"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Réinitialiser la Base de Données</span>
                    </button>
                  ) : (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                      <div>
                        <p className="text-xs font-bold text-red-800">Êtes-vous sûr à 100% ?</p>
                        <p className="text-[11px] text-red-600">Cette action restaurera les données d'exemple d'origine d'Ali Mobile.</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleResetDB();
                            setShowResetConfirm(false);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                        >
                          Oui, réinitialiser
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3.5 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="no-print space-y-6 max-w-4xl mx-auto w-full animate-fadeIn">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase italic flex items-center">
                  <User className="w-6 h-6 mr-2 text-orange-500" />
                  <span>Profil Utilisateur Connecté</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">Consultez les informations de votre session active et gérez les comptes.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Profile Card Left */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-none p-6 space-y-5 flex flex-col items-center text-center">
                  {/* Avatar initials */}
                  <div className="w-20 h-20 rounded-none bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center font-bold text-2xl uppercase shadow-md">
                    {activeAgentId === 'admin'
                      ? (currentUser?.name?.split(' ').map(n => n[0]).join('') || 'AD')
                      : agents.find(a => a.id === activeAgentId)?.name?.split(' ').map(n => n[0]).join('') || 'AG'}
                  </div>

                  {!selfEditMode ? (
                    <>
                      <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                          {activeAgentId === 'admin' ? (currentUser?.name || 'Administrateur') : agents.find(a => a.id === activeAgentId)?.name}
                        </h3>
                        <span className="inline-block mt-1 px-3 py-1 bg-orange-50 border border-orange-200 text-orange-600 rounded-none text-[10px] font-bold uppercase tracking-wider">
                          {activeAgentId === 'admin' ? 'Administrateur' : (agents.find(a => a.id === activeAgentId)?.role === 'operator' ? 'Opérateur' : 'Agent de Vente')}
                        </span>
                      </div>

                      <div className="w-full border-t border-slate-100 pt-4 space-y-2.5 text-xs text-left">
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-400 font-medium shrink-0">Email :</span>
                          <span className="text-slate-800 font-bold font-mono text-right truncate">
                            {activeAgentId === 'admin' ? (currentUser?.email || '—') : agents.find(a => a.id === activeAgentId)?.email}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-400 font-medium shrink-0">Téléphone :</span>
                          <span className="text-slate-800 font-bold font-mono">
                            {activeAgentId === 'admin' ? (currentUser?.phone || '—') : agents.find(a => a.id === activeAgentId)?.phone}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-400 font-medium shrink-0">Code ID :</span>
                          <span className="text-slate-800 font-bold font-mono">
                            {activeAgentId === 'admin' ? (currentUser?.code || '—') : agents.find(a => a.id === activeAgentId)?.code}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-400 font-medium shrink-0">Ville :</span>
                          <span className="text-slate-800 font-bold">
                            {activeAgentId === 'admin' ? (currentUser?.city || 'Bukavu') : (agents.find(a => a.id === activeAgentId)?.city || 'Bukavu')}, RDC
                          </span>
                        </div>
                      </div>

                      {/* Edit button — only for the currently logged-in user's own card */}
                      {activeAgentId === 'admin' && (
                        <button
                          onClick={() => {
                            setSelfEditName(currentUser?.name || '');
                            setSelfEditPhone(currentUser?.phone || '');
                            setSelfEditCity(currentUser?.city || 'Bukavu');
                            setSelfEditMode(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-none transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Modifier mon profil
                        </button>
                      )}
                    </>
                  ) : (
                    /* Self-edit form */
                    <form onSubmit={handleSaveSelfProfile} className="w-full space-y-3 text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500 text-center border-b border-slate-100 pb-2">
                        Modifier mes informations
                      </p>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Nom complet</label>
                        <input
                          type="text"
                          value={selfEditName}
                          onChange={e => setSelfEditName(e.target.value)}
                          required
                          placeholder="Votre nom complet"
                          className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Téléphone</label>
                        <input
                          type="tel"
                          value={selfEditPhone}
                          onChange={e => setSelfEditPhone(e.target.value)}
                          placeholder="+243..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Ville</label>
                        <select
                          value={selfEditCity}
                          onChange={e => setSelfEditCity(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        >
                          {['Bukavu', 'Goma', 'Kinshasa', 'Beni', 'Butembo'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isSavingSelfProfile}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-none transition-colors"
                        >
                          {isSavingSelfProfile ? 'Sauvegarde…' : 'Enregistrer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelfEditMode(false)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider py-2.5 rounded-none transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  )}
                </div>


                {/* Profile Stats & Subordinates/Agents creation Right */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Session Metrics block */}
                  <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
                      Statistiques de Performance de Session
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold">Contrats Gérés</span>
                        <span className="text-lg font-black block text-slate-800 font-mono mt-0.5">
                          {activeAgentId === 'admin' ? contracts.length : contracts.filter(c => c.agentId === activeAgentId).length}
                        </span>
                      </div>
                      <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50">
                        <span className="text-[9px] text-emerald-600 block uppercase font-mono font-bold">Total Encaissé</span>
                        <span className="text-lg font-black block text-emerald-700 font-mono mt-0.5">
                          {activeAgentId === 'admin' ? totalEncaisse.toFixed(0) : payments.filter(p => p.agentId === activeAgentId && p.status === 'Terminé').reduce((acc, curr) => acc + curr.amountUsd, 0).toFixed(0)} $
                        </span>
                      </div>
                      <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50">
                        <span className="text-[9px] text-amber-600 block uppercase font-mono font-bold">Encours Actif</span>
                        <span className="text-lg font-black block text-amber-700 font-mono mt-0.5">
                          {activeAgentId === 'admin' ? totalRestant.toFixed(0) : (contracts.filter(c => c.agentId === activeAgentId).reduce((acc, curr) => acc + (smartphones.find(p => p.id === curr.smartphoneId)?.valueUsd || 0), 0) - payments.filter(p => p.agentId === activeAgentId && p.status === 'Terminé').reduce((acc, curr) => acc + curr.amountUsd, 0)).toFixed(0)} $
                        </span>
                      </div>
                      <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50">
                        <span className="text-[9px] text-indigo-600 block uppercase font-mono font-bold">Taux Recouvr.</span>
                        <span className="text-lg font-black block text-indigo-700 font-mono mt-0.5">
                          {activeAgentId === 'admin'
                            ? (totalPortfolioValue > 0 ? Math.round((totalEncaisse / totalPortfolioValue) * 100) : 0)
                            : (() => {
                              const agentSales = contracts.filter(c => c.agentId === activeAgentId).reduce((acc, curr) => acc + (smartphones.find(p => p.id === curr.smartphoneId)?.valueUsd || 0), 0);
                              const agentColl = payments.filter(p => p.agentId === activeAgentId && p.status === 'Terminé').reduce((acc, curr) => acc + curr.amountUsd, 0);
                              return agentSales > 0 ? Math.round((agentColl / agentSales) * 100) : 0;
                            })()}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Creation Form: ONLY if admin */}
                  {currentUser?.role === 'admin' ? (
                    <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-4 animate-fadeIn">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display flex items-center">
                          <UserPlus className="w-4 h-4 mr-1.5 text-orange-500" />
                          <span>Créer un Compte Subordonné (Admin, Agent ou Opérateur)</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Enregistrer un nouvel utilisateur habilité à utiliser l'application Ali Mobile.</p>
                      </div>

                      <form onSubmit={handleCreateSubordinate} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Rôle de l'utilisateur</label>
                            <select
                              value={newUserRole}
                              onChange={(e) => setNewUserRole(e.target.value as any)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
                            >
                              <option value="agent">Agent de Vente Agréé</option>
                              <option value="operator">Opérateur Utilités</option>
                              <option value="admin">Administrateur Subordonné</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Ville d'affectation</label>
                            <input
                              type="text"
                              required
                              value={newUserCity}
                              onChange={(e) => setNewUserCity(e.target.value)}
                              placeholder="Ex: Bukavu, Bukavu, Kinshasa..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 text-slate-800 font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Code d'identification (Généré)</label>
                            <input
                              type="text"
                              required
                              value={newUserCode}
                              onChange={(e) => setNewUserCode(e.target.value)}
                              placeholder="Ex: AG-243-04"
                              className="w-full bg-slate-100 border border-slate-200 rounded-xl text-xs px-3 py-2.5 focus:outline-none text-slate-700 font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Nom Complet</label>
                            <input
                              type="text"
                              required
                              value={newUserName}
                              onChange={(e) => setNewUserName(e.target.value)}
                              placeholder="Ex: Christian Muhindo"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 text-slate-800 font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Adresse Email</label>
                            <input
                              type="email"
                              required
                              value={newUserEmail}
                              onChange={(e) => setNewUserEmail(e.target.value)}
                              placeholder="Ex: c.muhindo@alimobile.com"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 text-slate-800 font-mono font-medium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Numéro de Téléphone</label>
                            <input
                              type="text"
                              required
                              value={newUserPhone}
                              onChange={(e) => setNewUserPhone(e.target.value)}
                              placeholder="Ex: +243 824 444 204"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 text-slate-800 font-mono font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Mot de passe initial</label>
                            <input
                              type="password"
                              required
                              value={newUserPassword}
                              onChange={(e) => setNewUserPassword(e.target.value)}
                              placeholder="Mot de passe temporaire..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 text-slate-800 font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="submit"
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-xl text-xs transition flex items-center space-x-2 cursor-pointer shadow-md shadow-orange-500/10"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Enregistrer le compte</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-center text-slate-500 space-y-2 text-xs">
                      <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-700">Privilèges restreints</p>
                      <p className="max-w-md mx-auto">
                        Seul l'administrateur principal (<span className="font-bold text-slate-900">Franck Alliance</span>) dispose des droits de création pour de nouveaux administrateurs subordonnés ou agents de vente.
                      </p>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* Utility Transactions Tab (Airtel & Vodacom) */}
          {activeTab === 'transactions' && (
            <div className="no-print max-w-7xl mx-auto w-full">
              <TransactionsTab
                transactions={transactions}
                agents={agents}
                currentUser={currentUser}
                canCreate={currentUser?.role === 'admin' || currentUser?.role === 'operator'}
                onAddTransaction={handleAddTransaction}
                onRefresh={refreshData}
                showToast={showToast}
              />
            </div>
          )}

          {/* Detailed Modal of Client Profile */}
          <AnimatePresence>
            {selectedClientForDetails && (
              <div className="no-print fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-100 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">
                      Fiche d'Information Client
                    </h3>
                    <button
                      onClick={() => setSelectedClientForDetails(null)}
                      className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Top Identity card style block */}
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100 flex items-center justify-center font-bold text-lg uppercase">
                        {selectedClientForDetails.lastName[0]}{selectedClientForDetails.firstName[0]}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900 uppercase font-display tracking-tight">
                          {selectedClientForDetails.lastName} {selectedClientForDetails.middleName} {selectedClientForDetails.firstName}
                        </h4>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">Enregistré le : {selectedClientForDetails.registeredAt}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80 space-y-2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Contacts</span>
                        <div><span className="text-slate-500 font-medium">WhatsApp :</span> <span className="font-mono text-slate-800 font-bold">{selectedClientForDetails.phoneWhatsApp}</span></div>
                        <div><span className="text-slate-500 font-medium">Urgence :</span> <span className="font-mono text-slate-700 font-semibold">{selectedClientForDetails.phoneUrgency}</span></div>
                      </div>

                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80 space-y-2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Document d'identité</span>
                        <div><span className="text-slate-500 font-medium">Type :</span> <span className="text-slate-700 font-semibold">{selectedClientForDetails.identityDocType}</span></div>
                        <div><span className="text-slate-500 font-medium">Numéro :</span> <span className="font-mono text-slate-800 font-bold underline">{selectedClientForDetails.identityDocNum}</span></div>
                      </div>

                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80 space-y-2 md:col-span-2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Adresse Physique</span>
                        <div className="text-slate-700 font-semibold">
                          N° {selectedClientForDetails.addressNum}, Avenue {selectedClientForDetails.addressAvenue}, Quartier {selectedClientForDetails.neighborhood}, Commune/Ville : {selectedClientForDetails.cityCommune}
                        </div>
                      </div>
                    </div>

                    {/* Associated payment history */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Historique des traites payées</span>
                      <div className="border border-slate-150 rounded-2xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[9px]">
                            <tr>
                              <th className="p-2.5">Date</th>
                              <th className="p-2.5">Transaction Ref</th>
                              <th className="p-2.5">Méthode</th>
                              <th className="p-2.5 text-right">Montant ($)</th>
                              <th className="p-2.5 text-center">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {payments.filter(p => p.clientId === selectedClientForDetails.id).map(p => (
                              <tr key={p.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-2.5 text-slate-500">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                                <td className="p-2.5 font-mono text-slate-700 font-semibold">{p.transactionRef}</td>
                                <td className="p-2.5 text-slate-500">{p.paymentMethod}</td>
                                <td className="p-2.5 text-right font-extrabold text-slate-900">{p.amountUsd.toFixed(2)} $</td>
                                <td className="p-2.5 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${p.status === 'Terminé'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : 'bg-red-50 text-red-700 border border-red-100'
                                    }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setSelectedClientForDetails(null)}
                      className="bg-orange-500 text-white hover:bg-orange-600 py-2 px-5 rounded-xl font-bold text-xs transition shadow-sm shadow-orange-500/10 cursor-pointer"
                    >
                      Fermer
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Full Screen Contract printable PDF layout */}
          <AnimatePresence>
            {viewingContractDoc && (
              (() => {
                const client = clients.find(c => c.id === viewingContractDoc.clientId);
                const phone = smartphones.find(p => p.id === viewingContractDoc.smartphoneId);

                const contractAgent = agents.find(a => a.id === viewingContractDoc.agentId);
                const agentName = viewingContractDoc.agentId === currentUser?.id
                  ? (currentUser?.name || 'Administrateur')
                  : (contractAgent?.name || currentUser?.name || 'Agent Ali Mobile');
                const agentCity = contractAgent?.city || (viewingContractDoc.agentId === currentUser?.id ? currentUser?.city : undefined) || 'Bukavu';

                if (!client || !phone) return null;

                return (
                  <div className="fixed inset-0 bg-black/95 overflow-y-auto z-50 flex flex-col p-4 md:p-8 contract-preview-overlay">
                    {/* Control Bar - No Print */}
                    <div className="no-print max-w-[800px] mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-3 mb-4 bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                        <span className="text-xs text-neutral-300 font-semibold font-display">CONTRAT PRÊT À L'IMPRESSION (PDF)</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleExportPDF}
                          className="bg-orange-500 hover:bg-orange-600 text-white py-1.5 px-4 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-orange-500/20"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Télécharger le PDF direct</span>
                        </button>
                        <button
                          onClick={handlePrintContract}
                          className="bg-white text-black hover:bg-neutral-200 py-1.5 px-4 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimer (Navigateur)</span>
                        </button>
                        <button
                          onClick={() => setViewingContractDoc(null)}
                          className="bg-neutral-800 hover:bg-neutral-750 text-white py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Fermer l'aperçu
                        </button>
                      </div>
                    </div>

                    {/* Print Container holding high fidelity sheet */}
                    <div className="flex-grow flex items-center justify-center">
                      <ContractDocument
                        contract={viewingContractDoc}
                        client={client}
                        smartphone={phone}
                        agentName={agentName}
                        agentCity={agentCity}
                      />
                    </div>
                  </div>
                );
              })()
            )}

            {/* Modal: Create User */}
            {showCreateUserModal && (
              <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-none w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <UserPlus className="w-5 h-5 text-orange-500" />
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
                        Créer un Nouvel Utilisateur
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowCreateUserModal(false)}
                      className="text-slate-400 hover:text-slate-600 p-1.5 rounded-none hover:bg-slate-100 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateSubordinate} className="p-6 space-y-4 overflow-y-auto">
                    {/* Role selection */}
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1.5">
                        Rôle de l'utilisateur
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'agent', label: 'Agent de Vente', desc: 'Crée contrats & encaisse' },
                          { id: 'operator', label: 'Opérateur Utilités', desc: 'Gère utilités Airtel/Voda' },
                          { id: 'admin', label: 'Admin Adjoint', desc: 'Gestion complète' },
                        ].map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setNewUserRole(r.id as any)}
                            className={`p-3 rounded-none border text-left transition cursor-pointer ${
                              newUserRole === r.id
                                ? 'border-orange-500 bg-orange-50/60 ring-1 ring-orange-500'
                                : 'border-slate-200 hover:bg-slate-50 bg-white'
                            }`}
                          >
                            <span className="block text-xs font-bold text-slate-900">{r.label}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5 leading-tight">{r.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Code d'identification unique & Ville */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                            Code ID Unique
                          </label>
                          <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-none border border-emerald-200">
                            Généré automatiquement
                          </span>
                        </div>
                        <input
                          type="text"
                          required
                          value={newUserCode}
                          onChange={(e) => setNewUserCode(e.target.value)}
                          placeholder="Ex: AG-243-04"
                          className="w-full bg-slate-50 border border-slate-200 rounded-none text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 text-slate-800 font-mono font-bold"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Code interne attribué à l'employé.</p>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                          Ville d'affectation
                        </label>
                        <input
                          type="text"
                          required
                          value={newUserCity}
                          onChange={(e) => setNewUserCity(e.target.value)}
                          placeholder="Ex: Goma, Bukavu, Kinshasa..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-none text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 text-slate-800 font-bold"
                        />
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {['Goma', 'Bukavu', 'Kinshasa', 'Beni', 'Butembo'].map(city => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => setNewUserCity(city)}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-none border cursor-pointer transition ${
                                newUserCity === city ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Nom & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                          Nom Complet
                        </label>
                        <input
                          type="text"
                          required
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="Ex: Patrick Kasereka"
                          className="w-full bg-slate-50 border border-slate-200 rounded-none text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 text-slate-800 font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                          Adresse Email (Connexion)
                        </label>
                        <input
                          type="email"
                          required
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="Ex: p.kasereka@alimobile.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-none text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 text-slate-800 font-mono"
                        />
                      </div>
                    </div>

                    {/* Téléphone */}
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                        Numéro de Téléphone (WhatsApp / SMS)
                      </label>
                      <input
                        type="text"
                        required
                        value={newUserPhone}
                        onChange={(e) => setNewUserPhone(e.target.value)}
                        placeholder="Ex: +243 970 000 000"
                        className="w-full bg-slate-50 border border-slate-200 rounded-none text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 text-slate-800 font-mono font-bold"
                      />
                    </div>

                    {/* Password Options */}
                    <div className="bg-slate-50 p-4 rounded-none border border-slate-200 space-y-3">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-700 block">
                        Configuration du mot de passe
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-start space-x-2.5 cursor-pointer">
                          <input
                            type="radio"
                            name="passOpt"
                            checked={createPasswordOption === 'invite'}
                            onChange={() => setCreatePasswordOption('invite')}
                            className="mt-0.5 text-orange-500 focus:ring-orange-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              Envoyer une invitation par email & générer le lien de configuration (Recommandé)
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              L'employé recevra un email ou vous pourrez lui transmettre le lien direct pour renseigner son propre mot de passe.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-2.5 cursor-pointer">
                          <input
                            type="radio"
                            name="passOpt"
                            checked={createPasswordOption === 'manual'}
                            onChange={() => setCreatePasswordOption('manual')}
                            className="mt-0.5 text-orange-500 focus:ring-orange-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              Définir manuellement un mot de passe temporaire
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Vous définissez le mot de passe initial dès maintenant.
                            </span>
                          </div>
                        </label>
                      </div>

                      {createPasswordOption === 'manual' && (
                        <div className="pt-2 animate-fadeIn">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                            Mot de passe initial (min 6 caractères)
                          </label>
                          <input
                            type="password"
                            required={createPasswordOption === 'manual'}
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="Entrez un mot de passe temporaire..."
                            className="w-full bg-white border border-slate-200 rounded-none text-xs px-3 py-2 focus:outline-none focus:border-orange-500 text-slate-800 font-mono font-bold"
                          />
                        </div>
                      )}
                    </div>

                    {/* Footer actions */}
                    <div className="pt-2 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateUserModal(false)}
                        className="px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessingUserAction}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-none text-xs uppercase tracking-wider transition flex items-center space-x-2 cursor-pointer shadow-none disabled:opacity-50"
                      >
                        {isProcessingUserAction ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Création...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Créer l'utilisateur</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            {/* Modal: Created User Direct Link */}
            {createdUserDirectLink && (
              <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-none w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4"
                >
                  <div className="flex items-center space-x-3 text-emerald-600">
                    <div className="w-10 h-10 bg-emerald-50 rounded-none border border-emerald-200 flex items-center justify-center">
                      <Check className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase font-display tracking-tight">
                        Compte créé avec succès !
                      </h3>
                      <p className="text-xs text-slate-500">
                        L'utilisateur <span className="font-bold text-slate-800">{createdUserDirectLink.name}</span> ({createdUserDirectLink.email}) est enregistré.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-none border border-slate-200 space-y-3 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Lien direct pour renseigner le mot de passe
                    </span>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Vous pouvez diriger directement l'utilisateur sur cette page pour qu'il renseigne son mot de passe ou lui transmettre le lien par WhatsApp/Email :
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={createdUserDirectLink.link}
                        className="flex-grow bg-white border border-slate-200 rounded-none px-3 py-2 text-xs font-mono text-slate-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(createdUserDirectLink.link);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 px-3 py-2 rounded-none font-bold text-xs uppercase tracking-wider flex items-center space-x-1 transition cursor-pointer"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>

                    {createdUserDirectLink.tempPass && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-none text-amber-800 font-mono text-xs">
                        Mot de passe temporaire défini : <span className="font-bold">{createdUserDirectLink.tempPass}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <a
                      href={createdUserDirectLink.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center space-x-1 cursor-pointer uppercase tracking-wider"
                    >
                      <span>Ouvrir la page de configuration</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setCreatedUserDirectLink(null)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-5 rounded-none text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      Terminé
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Modal: Reset Password */}
            {resetPasswordAgent && (
              <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-none w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5"
                >
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <div className="flex items-center space-x-2">
                      <Key className="w-5 h-5 text-amber-500" />
                      <h3 className="text-sm font-black text-slate-900 uppercase font-display tracking-tight">
                        Mot de Passe : {resetPasswordAgent.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setResetPasswordAgent(null);
                        setManualPasswordInput('');
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1.5 rounded-none hover:bg-slate-100 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Option 1: Trigger Reset Email */}
                    <div className="p-4 bg-slate-50 rounded-none border border-slate-200 space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                        Option 1 : Email de Réinitialisation
                      </span>
                      <p className="text-slate-600 text-[11px]">
                        Déclencher l'envoi d'un email contenant un lien sécurisé permettant à l'employé de réinitialiser son mot de passe.
                      </p>
                      <button
                        type="button"
                        disabled={isProcessingUserAction}
                        onClick={() => handleSendResetPasswordEmail(resetPasswordAgent)}
                        className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 py-2.5 px-3 rounded-none font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Envoyer l'email à {resetPasswordAgent.email}</span>
                      </button>
                    </div>

                    {/* Option 2: Direct set password */}
                    <form onSubmit={handleDirectSetPassword} className="p-4 bg-slate-50 rounded-none border border-slate-200 space-y-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                        Option 2 : Définir un nouveau mot de passe directement
                      </span>
                      <p className="text-slate-600 text-[11px]">
                        Attribuez immédiatement un nouveau mot de passe pour cet employé.
                      </p>
                      <input
                        type="password"
                        value={manualPasswordInput}
                        onChange={(e) => setManualPasswordInput(e.target.value)}
                        placeholder="Nouveau mot de passe (min 6 caractères)..."
                        className="w-full bg-white border border-slate-200 rounded-none px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="submit"
                        disabled={isProcessingUserAction || manualPasswordInput.length < 6}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-3 rounded-none font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Enregistrer le nouveau mot de passe</span>
                      </button>
                    </form>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setResetPasswordAgent(null);
                        setManualPasswordInput('');
                      }}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 rounded-none transition cursor-pointer"
                    >
                      Fermer
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Modal: Edit User */}
            {editingAgent && (
              <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-none w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4"
                >
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <div className="flex items-center space-x-2">
                      <Edit3 className="w-5 h-5 text-orange-500" />
                      <h3 className="text-sm font-black text-slate-900 uppercase font-display tracking-tight">
                        Modifier l'Utilisateur
                      </h3>
                    </div>
                    <button
                      onClick={() => setEditingAgent(null)}
                      className="text-slate-400 hover:text-slate-600 p-1.5 rounded-none hover:bg-slate-100 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditAgent} className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                        Nom Complet
                      </label>
                      <input
                        type="text"
                        required
                        value={editAgentName}
                        onChange={(e) => setEditAgentName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-none text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 text-slate-800 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                        Numéro de Téléphone
                      </label>
                      <input
                        type="text"
                        required
                        value={editAgentPhone}
                        onChange={(e) => setEditAgentPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-none text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 text-slate-800 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                        Ville d'affectation
                      </label>
                      <input
                        type="text"
                        required
                        value={editAgentCity}
                        onChange={(e) => setEditAgentCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-none text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 text-slate-800 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                        Rôle Attribué
                      </label>
                      <select
                        value={editAgentRole}
                        disabled={editingAgent.id === currentUser?.id}
                        onChange={(e) => setEditAgentRole(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-none text-xs px-3 py-2.5 focus:outline-none focus:border-orange-500 font-bold cursor-pointer disabled:opacity-50"
                      >
                        <option value="agent">Agent de Vente</option>
                        <option value="operator">Opérateur Utilités</option>
                        <option value="admin">Administrateur</option>
                      </select>
                      {editingAgent.id === currentUser?.id && (
                        <p className="text-[10px] text-slate-400 mt-1">Vous ne pouvez pas révoquer votre propre rôle.</p>
                      )}
                    </div>

                    <div className="pt-2 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingAgent(null)}
                        className="px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessingUserAction}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-none text-xs uppercase tracking-wider transition cursor-pointer shadow-none disabled:opacity-50"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            {/* Modal: Delete Agent Confirm */}
            {deleteAgentConfirm && (
              <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-none w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4"
                >
                  <div className="flex items-center space-x-3 text-red-600">
                    <div className="w-10 h-10 bg-red-50 rounded-none border border-red-200 flex items-center justify-center shrink-0">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase font-display tracking-tight">
                        Supprimer l'Utilisateur
                      </h3>
                      <p className="text-xs text-slate-500">
                        Êtes-vous certain de vouloir supprimer le compte de <span className="font-bold text-slate-800">{deleteAgentConfirm.name}</span> ({deleteAgentConfirm.code}) ?
                      </p>
                    </div>
                  </div>

                  {contracts.some(c => c.agentId === deleteAgentConfirm.id) && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-none text-xs text-amber-800 space-y-1">
                      <div className="flex items-center space-x-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Attention aux contrats liés</span>
                      </div>
                      <p className="text-[11px]">
                        Cet agent est associé à des contrats dans l'application. Si certains sont encore actifs, la suppression sera bloquée pour préserver l'intégrité des données.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteAgentConfirm(null)}
                      className="px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingUserAction}
                      onClick={handleDeleteAgent}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-none text-xs uppercase tracking-wider transition cursor-pointer shadow-none disabled:opacity-50"
                    >
                      {isProcessingUserAction ? 'Suppression...' : 'Supprimer Définitivement'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </main>

        {/* Mobile Bottom Navigation Bar - Flat Modern Design with 0-radius */}
        <nav className="no-print md:hidden bg-[#0F172A] border-t border-slate-800 h-16 shrink-0 flex items-center justify-around z-40 text-slate-400 select-none">
          {[
            { id: 'dashboard', label: 'Bord', icon: TrendingUp },
            { id: 'contracts', label: 'Contrats', icon: Users },
            ...(currentUser?.role === 'operator' ? [
              { id: 'transactions', label: 'Trans.', icon: ArrowLeftRight },
            ] : [
              { id: 'new_contract', label: 'Nouveau', icon: PlusCircle },
              { id: 'new_payment', label: 'Paiement', icon: Coins },
            ]),
            { id: 'knox', label: 'Knox', icon: ShieldAlert, badge: filteredDelays.length > 0 ? filteredDelays.length : undefined },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSelectedClientForDetails(null);
                  setSelectedContract(null);
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all rounded-none ${isActive ? 'text-orange-400 font-bold bg-slate-800/20' : 'text-slate-400'
                  }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-orange-400' : 'text-slate-400'}`} />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-red-500 text-white font-mono text-[8px] font-bold px-1 rounded-none leading-none py-0.5">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
