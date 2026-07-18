/**
 * Database definitions and storage engine for Ali Mobile Credit & Financing Tracker.
 */

export interface Agent {
  id: string;
  name: string;
  email: string;
  code: string; // e.g. AG-243-01
  avatar?: string;
  phone: string;
}

export interface Smartphone {
  id: string;
  brand: string;
  model: string;
  valueUsd: number;
  imei: string;
}

export interface Client {
  id: string;
  lastName: string;       // Nom
  middleName?: string;    // Postnom
  firstName: string;      // Prénom
  phoneWhatsApp: string;
  phoneUrgency: string;
  addressNum: string;     // N°
  addressAvenue: string;  // Avenue
  neighborhood: string;   // Quartier
  cityCommune: string;    // Commune/Ville
  identityDocType: 'Carte d\'électeur' | 'Passeport' | 'Permis de conduire';
  identityDocNum: string;
  registeredAt: string;   // Date d'enregistrement
  agentId: string;        // Agent qui a créé le contrat
}

export type PaymentPlanType = 'hebdo' | 'mensuel';

export interface Contract {
  id: string;
  contractNumber: string; // AM-2026-XXXX
  clientId: string;
  smartphoneId: string;
  subscriptionDate: string;
  planType: PaymentPlanType;
  initialDepositUsd: number; // Acompte (50%)
  installmentAmountUsd: number; // Montant de la traite
  totalInstallments: number; // Nombre d'échéances (8 semaines pour hebdo, 2 mois pour mensuel)
  paymentDay: string; // "Samedi" ou "Le X de chaque mois"
  status: 'en_cours' | 'termine' | 'en_retard' | 'bloque';
  agentId: string;
}

export interface Payment {
  id: string;
  contractNumber: string;
  clientId: string;
  amountUsd: number;
  amountCdf: number; // CDF equivalent
  date: string;
  dueDate: string; // Échéance visée
  paymentMethod: 'Mobile Money (M-Pesa)' | 'Mobile Money (Airtel Money)' | 'Mobile Money (Orange Money)' | 'Espèces' | 'Carte';
  status: 'Terminé' | 'Échec' | 'En attente';
  transactionRef: string;
  agentId: string;
}

export interface DelayRecord {
  id: string;
  contractNumber: string;
  clientId: string;
  dueDate: string;
  amountUsd: number;
  daysOverdue: number;
  status: 'Actif' | 'Résolu';
}

// Default Seed Data
export const SEED_AGENTS: Agent[] = [
  { id: 'agent-1', name: 'Jean-Pierre Baraka', email: 'jp.baraka@alimobile.com', code: 'AG-243-01', phone: '+243 824 444 201' },
  { id: 'agent-2', name: 'Marie Kavira', email: 'm.kavira@alimobile.com', code: 'AG-243-02', phone: '+243 824 444 202' },
  { id: 'agent-3', name: 'Grace Bahati', email: 'g.bahati@alimobile.com', code: 'AG-243-03', phone: '+243 824 444 203' }
];

export const SEED_SMARTPHONES: Smartphone[] = [
  { id: 'phone-1', brand: 'Samsung', model: 'Galaxy A15', valueUsd: 180, imei: '354892110298374' },
  { id: 'phone-2', brand: 'Samsung', model: 'Galaxy A25 5G', valueUsd: 260, imei: '356711220498321' },
  { id: 'phone-3', brand: 'Samsung', model: 'Galaxy A35 5G', valueUsd: 340, imei: '358901110587213' },
  { id: 'phone-4', brand: 'Samsung', model: 'Galaxy A55 5G', valueUsd: 450, imei: '359012340123456' },
  { id: 'phone-5', brand: 'Samsung', model: 'Galaxy S24 FE', valueUsd: 680, imei: '357123990887221' }
];

export const SEED_CLIENTS: Client[] = [
  {
    id: 'client-1',
    lastName: 'Kakule',
    middleName: 'Kasaki',
    firstName: 'Samuel',
    phoneWhatsApp: '+243 997 123 456',
    phoneUrgency: '+243 812 345 678',
    addressNum: '17',
    addressAvenue: 'des Écoles',
    neighborhood: 'Goma',
    cityCommune: 'Goma',
    identityDocType: 'Carte d\'électeur',
    identityDocNum: 'ELEC-243-98765-A',
    registeredAt: '2026-06-08',
    agentId: 'agent-1'
  },
  {
    id: 'client-2',
    lastName: 'Mwanza',
    middleName: 'Mulumba',
    firstName: 'Archange',
    phoneWhatsApp: '+243 971 888 222',
    phoneUrgency: '+243 854 333 111',
    addressNum: '45',
    addressAvenue: 'du Lac',
    neighborhood: 'Himbi',
    cityCommune: 'Goma',
    identityDocType: 'Passeport',
    identityDocNum: 'OP-0089122',
    registeredAt: '2026-07-02',
    agentId: 'agent-1'
  },
  {
    id: 'client-3',
    lastName: 'Kavuo',
    middleName: 'Meso',
    firstName: 'Aline',
    phoneWhatsApp: '+243 994 555 666',
    phoneUrgency: '+243 821 777 888',
    addressNum: '102',
    addressAvenue: 'de la Révolution',
    neighborhood: 'Katindo',
    cityCommune: 'Goma',
    identityDocType: 'Carte d\'électeur',
    identityDocNum: 'ELEC-243-55122-C',
    registeredAt: '2026-07-10',
    agentId: 'agent-2'
  },
  {
    id: 'client-4',
    lastName: 'Amisi',
    middleName: 'Ramazani',
    firstName: 'Trésor',
    phoneWhatsApp: '+243 991 222 333',
    phoneUrgency: '+243 899 444 555',
    addressNum: '8B',
    addressAvenue: 'Kanyamuhanga',
    neighborhood: 'Les Volcans',
    cityCommune: 'Goma',
    identityDocType: 'Permis de conduire',
    identityDocNum: 'PERM-243-00912',
    registeredAt: '2026-05-15',
    agentId: 'agent-3'
  }
];

export const SEED_CONTRATS: Contract[] = [
  {
    id: 'contract-1',
    contractNumber: 'AM-2026-001',
    clientId: 'client-1',
    smartphoneId: 'phone-3', // Galaxy A35 ($340)
    subscriptionDate: '2026-06-08',
    planType: 'hebdo',
    initialDepositUsd: 170, // 50%
    installmentAmountUsd: 21.25, // $170 / 8 weeks = $21.25
    totalInstallments: 8,
    paymentDay: 'Samedi',
    status: 'en_cours',
    agentId: 'agent-1'
  },
  {
    id: 'contract-2',
    contractNumber: 'AM-2026-002',
    clientId: 'client-2',
    smartphoneId: 'phone-2', // Galaxy A25 ($260)
    subscriptionDate: '2026-07-02',
    planType: 'mensuel',
    initialDepositUsd: 130, // 50%
    installmentAmountUsd: 65, // $130 / 2 months = $65
    totalInstallments: 2,
    paymentDay: '05', // Le 5 du mois
    status: 'bloque', // Knox Lock active due to missed payment
    agentId: 'agent-1'
  },
  {
    id: 'contract-3',
    contractNumber: 'AM-2026-003',
    clientId: 'client-3',
    smartphoneId: 'phone-1', // Galaxy A15 ($180)
    subscriptionDate: '2026-07-10',
    planType: 'hebdo',
    initialDepositUsd: 90, // 50%
    installmentAmountUsd: 11.25,
    totalInstallments: 8,
    paymentDay: 'Samedi',
    status: 'en_cours',
    agentId: 'agent-2'
  },
  {
    id: 'contract-4',
    contractNumber: 'AM-2026-004',
    clientId: 'client-4',
    smartphoneId: 'phone-1', // Galaxy A15 ($180)
    subscriptionDate: '2026-05-15',
    planType: 'hebdo',
    initialDepositUsd: 90,
    installmentAmountUsd: 11.25,
    totalInstallments: 8,
    paymentDay: 'Samedi',
    status: 'termine', // Fully paid
    agentId: 'agent-3'
  }
];

// 1 USD = 2800 CDF (Goma Rate circa 2026)
export const USD_TO_CDF = 2800;

export const SEED_PAIEMENTS: Payment[] = [
  // Payments for Contract 1 (Samuel Kakule) - Galaxy A35 ($340)
  // Total due: initial deposit $170 (paid on subscription 2026-06-08) + 8 weekly payments of $21.25
  {
    id: 'pay-101',
    contractNumber: 'AM-2026-001',
    clientId: 'client-1',
    amountUsd: 170,
    amountCdf: 170 * USD_TO_CDF,
    date: '2026-06-08T10:30:00',
    dueDate: '2026-06-08',
    paymentMethod: 'Mobile Money (M-Pesa)',
    status: 'Terminé',
    transactionRef: 'MP-TRX-882910-A',
    agentId: 'agent-1'
  },
  {
    id: 'pay-102',
    contractNumber: 'AM-2026-001',
    clientId: 'client-1',
    amountUsd: 21.25,
    amountCdf: 21.25 * USD_TO_CDF,
    date: '2026-06-13T16:15:00',
    dueDate: '2026-06-13',
    paymentMethod: 'Mobile Money (M-Pesa)',
    status: 'Terminé',
    transactionRef: 'MP-TRX-893012-C',
    agentId: 'agent-1'
  },
  {
    id: 'pay-103',
    contractNumber: 'AM-2026-001',
    clientId: 'client-1',
    amountUsd: 21.25,
    amountCdf: 21.25 * USD_TO_CDF,
    date: '2026-06-20T11:00:00',
    dueDate: '2026-06-20',
    paymentMethod: 'Mobile Money (Airtel Money)',
    status: 'Terminé',
    transactionRef: 'AM-TRX-102931-F',
    agentId: 'agent-1'
  },
  {
    id: 'pay-104',
    contractNumber: 'AM-2026-001',
    clientId: 'client-1',
    amountUsd: 21.25,
    amountCdf: 21.25 * USD_TO_CDF,
    date: '2026-06-27T09:45:00',
    dueDate: '2026-06-27',
    paymentMethod: 'Mobile Money (M-Pesa)',
    status: 'Terminé',
    transactionRef: 'MP-TRX-912834-K',
    agentId: 'agent-1'
  },
  {
    id: 'pay-105',
    contractNumber: 'AM-2026-001',
    clientId: 'client-1',
    amountUsd: 21.25,
    amountCdf: 21.25 * USD_TO_CDF,
    date: '2026-07-04T18:30:00',
    dueDate: '2026-07-04',
    paymentMethod: 'Mobile Money (M-Pesa)',
    status: 'Terminé',
    transactionRef: 'MP-TRX-922904-L',
    agentId: 'agent-1'
  },
  {
    id: 'pay-106',
    contractNumber: 'AM-2026-001',
    clientId: 'client-1',
    amountUsd: 21.25,
    amountCdf: 21.25 * USD_TO_CDF,
    date: '2026-07-11T14:20:00',
    dueDate: '2026-07-11',
    paymentMethod: 'Espèces',
    status: 'Terminé',
    transactionRef: 'CASH-2026-0129',
    agentId: 'agent-1'
  },
  // In the Starlink-like screenshot we have some failed payments and successful ones:
  {
    id: 'pay-107f',
    contractNumber: 'AM-2026-001',
    clientId: 'client-1',
    amountUsd: 21.25,
    amountCdf: 21.25 * USD_TO_CDF,
    date: '2026-07-17T08:12:00',
    dueDate: '2026-07-18',
    paymentMethod: 'Mobile Money (M-Pesa)',
    status: 'Échec',
    transactionRef: 'MP-TRX-955122-E',
    agentId: 'agent-1'
  },

  // Payments for Contract 2 (Archange Mwanza - Galaxy A25 - $260)
  // Deposit paid ($130) on subscription 2026-07-02
  {
    id: 'pay-201',
    contractNumber: 'AM-2026-002',
    clientId: 'client-2',
    amountUsd: 130,
    amountCdf: 130 * USD_TO_CDF,
    date: '2026-07-02T14:00:00',
    dueDate: '2026-07-02',
    paymentMethod: 'Mobile Money (Orange Money)',
    status: 'Terminé',
    transactionRef: 'OM-TRX-331209-X',
    agentId: 'agent-1'
  },
  // Missed payment on 2026-08-05 (Wait, current date is July 18, 2026! Wait, if subscription was July 02, and installment was due July 15? Ah! If the plan is Monthly, the next installments are due August 02. Why is he blocked or in delay?
  // Let's adjust subscription dates so that we have realistic delay!)
  // Let's say Contract 2 (Archange Mwanza) subscribed on 2026-05-02.
  // Then monthly installment 1 was due 2026-06-02 (Paid!), and installment 2 was due 2026-07-02 (Unpaid! Status = en_retard/bloque). This is extremely cohesive!
  {
    id: 'pay-202',
    contractNumber: 'AM-2026-002',
    clientId: 'client-2',
    amountUsd: 65,
    amountCdf: 65 * USD_TO_CDF,
    date: '2026-06-02T11:45:00',
    dueDate: '2026-06-02',
    paymentMethod: 'Mobile Money (Orange Money)',
    status: 'Terminé',
    transactionRef: 'OM-TRX-341901-Z',
    agentId: 'agent-1'
  },
  {
    id: 'pay-203-failed',
    contractNumber: 'AM-2026-002',
    clientId: 'client-2',
    amountUsd: 65,
    amountCdf: 65 * USD_TO_CDF,
    date: '2026-07-03T09:00:00',
    dueDate: '2026-07-02',
    paymentMethod: 'Mobile Money (Orange Money)',
    status: 'Échec',
    transactionRef: 'OM-TRX-359902-W',
    agentId: 'agent-1'
  },

  // Payments for Contract 3 (Aline Kavuo)
  {
    id: 'pay-301',
    contractNumber: 'AM-2026-003',
    clientId: 'client-3',
    amountUsd: 90,
    amountCdf: 90 * USD_TO_CDF,
    date: '2026-07-10T15:30:00',
    dueDate: '2026-07-10',
    paymentMethod: 'Mobile Money (M-Pesa)',
    status: 'Terminé',
    transactionRef: 'MP-TRX-948123-U',
    agentId: 'agent-2'
  },

  // Payments for Contract 4 (Trésor Amisi - fully paid $180)
  // Deposit $90, then 8 payments of $11.25.
  {
    id: 'pay-401',
    contractNumber: 'AM-2026-004',
    clientId: 'client-4',
    amountUsd: 90,
    amountCdf: 90 * USD_TO_CDF,
    date: '2026-05-15T11:00:00',
    dueDate: '2026-05-15',
    paymentMethod: 'Espèces',
    status: 'Terminé',
    transactionRef: 'CASH-2026-0055',
    agentId: 'agent-3'
  },
  // 8 weekly payments of $11.25
  { id: 'pay-402', contractNumber: 'AM-2026-004', clientId: 'client-4', amountUsd: 11.25, amountCdf: 11.25 * USD_TO_CDF, date: '2026-05-22T14:30:00', dueDate: '2026-05-22', paymentMethod: 'Espèces', status: 'Terminé', transactionRef: 'CASH-402', agentId: 'agent-3' },
  { id: 'pay-403', contractNumber: 'AM-2026-004', clientId: 'client-4', amountUsd: 11.25, amountCdf: 11.25 * USD_TO_CDF, date: '2026-05-29T10:15:00', dueDate: '2026-05-29', paymentMethod: 'Espèces', status: 'Terminé', transactionRef: 'CASH-403', agentId: 'agent-3' },
  { id: 'pay-404', contractNumber: 'AM-2026-004', clientId: 'client-4', amountUsd: 11.25, amountCdf: 11.25 * USD_TO_CDF, date: '2026-06-05T16:00:00', dueDate: '2026-06-05', paymentMethod: 'Espèces', status: 'Terminé', transactionRef: 'CASH-404', agentId: 'agent-3' },
  { id: 'pay-405', contractNumber: 'AM-2026-004', clientId: 'client-4', amountUsd: 11.25, amountCdf: 11.25 * USD_TO_CDF, date: '2026-06-12T12:00:00', dueDate: '2026-06-12', paymentMethod: 'Espèces', status: 'Terminé', transactionRef: 'CASH-405', agentId: 'agent-3' },
  { id: 'pay-406', contractNumber: 'AM-2026-004', clientId: 'client-4', amountUsd: 11.25, amountCdf: 11.25 * USD_TO_CDF, date: '2026-06-19T09:30:00', dueDate: '2026-06-19', paymentMethod: 'Espèces', status: 'Terminé', transactionRef: 'CASH-406', agentId: 'agent-3' },
  { id: 'pay-407', contractNumber: 'AM-2026-004', clientId: 'client-4', amountUsd: 11.25, amountCdf: 11.25 * USD_TO_CDF, date: '2026-06-26T15:10:00', dueDate: '2026-06-26', paymentMethod: 'Espèces', status: 'Terminé', transactionRef: 'CASH-407', agentId: 'agent-3' },
  { id: 'pay-408', contractNumber: 'AM-2026-004', clientId: 'client-4', amountUsd: 11.25, amountCdf: 11.25 * USD_TO_CDF, date: '2026-07-03T11:00:00', dueDate: '2026-07-03', paymentMethod: 'Espèces', status: 'Terminé', transactionRef: 'CASH-408', agentId: 'agent-3' },
  { id: 'pay-409', contractNumber: 'AM-2026-004', clientId: 'client-4', amountUsd: 11.25, amountCdf: 11.25 * USD_TO_CDF, date: '2026-07-10T10:00:00', dueDate: '2026-07-10', paymentMethod: 'Espèces', status: 'Terminé', transactionRef: 'CASH-409', agentId: 'agent-3' }
];

export const SEED_RETARDS: DelayRecord[] = [
  {
    id: 'delay-1',
    contractNumber: 'AM-2026-002',
    clientId: 'client-2',
    dueDate: '2026-07-02',
    amountUsd: 65,
    daysOverdue: 16, // Since today is July 18, 2026
    status: 'Actif'
  }
];

// Database storage keys
const STORAGE_KEYS = {
  CLIENTS: 'ali_mobile_clients',
  CONTRATS: 'ali_mobile_contrats',
  PAIEMENTS: 'ali_mobile_paiements',
  RETARDS: 'ali_mobile_retards',
  SMARTPHONES: 'ali_mobile_smartphones',
  AGENTS: 'ali_mobile_agents',
  ACTIVE_AGENT: 'ali_mobile_active_agent_id'
};

export class AliMobileDB {
  static getClients(): Client[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(SEED_CLIENTS));
      return SEED_CLIENTS;
    }
    return JSON.parse(raw);
  }

  static getContracts(): Contract[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTRATS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONTRATS, JSON.stringify(SEED_CONTRATS));
      return SEED_CONTRATS;
    }
    return JSON.parse(raw);
  }

  static getPayments(): Payment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PAIEMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PAIEMENTS, JSON.stringify(SEED_PAIEMENTS));
      return SEED_PAIEMENTS;
    }
    return JSON.parse(raw);
  }

  static getDelayRecords(): DelayRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RETARDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.RETARDS, JSON.stringify(SEED_RETARDS));
      return SEED_RETARDS;
    }
    return JSON.parse(raw);
  }

  static getSmartphones(): Smartphone[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SMARTPHONES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SMARTPHONES, JSON.stringify(SEED_SMARTPHONES));
      return SEED_SMARTPHONES;
    }
    return JSON.parse(raw);
  }

  static getAgents(): Agent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AGENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(SEED_AGENTS));
      return SEED_AGENTS;
    }
    return JSON.parse(raw);
  }

  static getActiveAgentId(): string {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_AGENT);
    if (!raw) {
      // Default to "all" (Admin View), or agent-1
      localStorage.setItem(STORAGE_KEYS.ACTIVE_AGENT, 'admin');
      return 'admin';
    }
    return raw;
  }

  static setActiveAgentId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_AGENT, id);
  }

  static saveClients(clients: Client[]): void {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }

  static saveContracts(contracts: Contract[]): void {
    localStorage.setItem(STORAGE_KEYS.CONTRATS, JSON.stringify(contracts));
  }

  static savePayments(payments: Payment[]): void {
    localStorage.setItem(STORAGE_KEYS.PAIEMENTS, JSON.stringify(payments));
  }

  static saveDelayRecords(delays: DelayRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.RETARDS, JSON.stringify(delays));
  }

  static saveSmartphones(phones: Smartphone[]): void {
    localStorage.setItem(STORAGE_KEYS.SMARTPHONES, JSON.stringify(phones));
  }

  static saveAgents(agents: Agent[]): void {
    localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(agents));
  }

  static resetDatabase(): void {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(SEED_CLIENTS));
    localStorage.setItem(STORAGE_KEYS.CONTRATS, JSON.stringify(SEED_CONTRATS));
    localStorage.setItem(STORAGE_KEYS.PAIEMENTS, JSON.stringify(SEED_PAIEMENTS));
    localStorage.setItem(STORAGE_KEYS.RETARDS, JSON.stringify(SEED_RETARDS));
    localStorage.setItem(STORAGE_KEYS.SMARTPHONES, JSON.stringify(SEED_SMARTPHONES));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_AGENT, 'admin');
  }

  static generateContractNumber(): string {
    const contracts = this.getContracts();
    const nextNum = contracts.length + 1;
    return `AM-2026-${String(nextNum).padStart(3, '0')}`;
  }

  static addContractWithClient(clientData: Omit<Client, 'id' | 'registeredAt'>, contractData: Omit<Contract, 'id' | 'contractNumber' | 'clientId' | 'status'>): { client: Client; contract: Contract; payment: Payment } {
    const clients = this.getClients();
    const contracts = this.getContracts();
    const payments = this.getPayments();

    const clientId = `client-${Date.now()}`;
    const contractId = `contract-${Date.now()}`;
    const paymentId = `pay-${Date.now()}`;
    const contractNum = this.generateContractNumber();
    const today = new Date().toISOString().split('T')[0];

    const newClient: Client = {
      ...clientData,
      id: clientId,
      registeredAt: today
    };

    const newContract: Contract = {
      ...contractData,
      id: contractId,
      clientId: clientId,
      contractNumber: contractNum,
      status: 'en_cours'
    };

    const newPayment: Payment = {
      id: paymentId,
      contractNumber: contractNum,
      clientId: clientId,
      amountUsd: contractData.initialDepositUsd,
      amountCdf: contractData.initialDepositUsd * USD_TO_CDF,
      date: new Date().toISOString(),
      dueDate: today,
      paymentMethod: 'Espèces', // Default for subscription in store
      status: 'Terminé',
      transactionRef: `STORE-INIT-${contractNum}`,
      agentId: contractData.agentId
    };

    clients.push(newClient);
    contracts.push(newContract);
    payments.unshift(newPayment); // Add to beginning of history

    this.saveClients(clients);
    this.saveContracts(contracts);
    this.savePayments(payments);

    return { client: newClient, contract: newContract, payment: newPayment };
  }

  static addPayment(contractNumber: string, amountUsd: number, paymentMethod: Payment['paymentMethod'], agentId: string, transactionRef?: string): Payment {
    const contracts = this.getContracts();
    const payments = this.getPayments();
    const contract = contracts.find(c => c.contractNumber === contractNumber);

    if (!contract) {
      throw new Error('Contrat introuvable');
    }

    const paymentId = `pay-${Date.now()}`;
    const todayStr = new Date().toISOString();
    const todayDateOnly = todayStr.split('T')[0];

    const ref = transactionRef || `MOMY-TRX-${Math.floor(100000 + Math.random() * 900000)}`;

    const newPayment: Payment = {
      id: paymentId,
      contractNumber,
      clientId: contract.clientId,
      amountUsd,
      amountCdf: amountUsd * USD_TO_CDF,
      date: todayStr,
      dueDate: todayDateOnly,
      paymentMethod,
      status: 'Terminé',
      transactionRef: ref,
      agentId
    };

    payments.unshift(newPayment);
    this.savePayments(payments);

    // After payment, let's recalculate and see if contract can be set to en_cours or termine
    this.recalculateContractStatus(contractNumber);

    return newPayment;
  }

  static recalculateContractStatus(contractNumber: string) {
    const contracts = this.getContracts();
    const payments = this.getPayments();
    const delays = this.getDelayRecords();

    const idx = contracts.findIndex(c => c.contractNumber === contractNumber);
    if (idx === -1) return;

    const contract = contracts[idx];
    const contractPayments = payments.filter(p => p.contractNumber === contractNumber && p.status === 'Terminé');
    
    // Total cost of phone = Acompte + Traites * NbÉchéances
    const totalSmartphoneValue = contract.initialDepositUsd + (contract.installmentAmountUsd * contract.totalInstallments);
    const totalPaid = contractPayments.reduce((acc, curr) => acc + curr.amountUsd, 0);

    // If fully paid
    if (totalPaid >= totalSmartphoneValue - 0.05) { // Floating point correction
      contract.status = 'termine';
      // Also resolve delay record if any
      const delayIdx = delays.findIndex(d => d.contractNumber === contractNumber);
      if (delayIdx !== -1) {
        delays[delayIdx].status = 'Résolu';
      }
    } else {
      // If it was blocked, and now they paid, unblock it
      // Standard rules: If they paid the due amount, they are 'en_cours'
      if (contract.status === 'bloque' || contract.status === 'en_retard') {
        contract.status = 'en_cours';
        const delayIdx = delays.findIndex(d => d.contractNumber === contractNumber && d.status === 'Actif');
        if (delayIdx !== -1) {
          delays[delayIdx].status = 'Résolu';
        }
      }
    }

    contracts[idx] = contract;
    this.saveContracts(contracts);
    this.saveDelayRecords(delays);
  }
}
