import { supabase } from './supabase';
import { Agent, Smartphone, Client, Contract, Payment, DelayRecord, PaymentPlanType } from '../data/db';

// DB mapping helpers (snake_case database to camelCase React models)
export function mapAgent(db: any): Agent {
  return {
    id: db.id,
    name: db.name,
    email: db.email,
    phone: db.phone,
    code: db.code,
    role: db.role,
  };
}

export function mapSmartphone(db: any): Smartphone {
  return {
    id: db.id,
    brand: db.brand,
    model: db.model,
    valueUsd: Number(db.value_usd),
    imei: db.imei,
  };
}

export function mapClient(db: any): Client {
  return {
    id: db.id,
    lastName: db.last_name,
    middleName: db.middle_name || undefined,
    firstName: db.first_name,
    phoneWhatsApp: db.phone_whatsapp,
    phoneUrgency: db.phone_urgency,
    addressNum: db.address_num,
    addressAvenue: db.address_avenue,
    neighborhood: db.neighborhood,
    cityCommune: db.city_commune,
    identityDocType: db.identity_doc_type,
    identityDocNum: db.identity_doc_num,
    registeredAt: db.registered_at,
    agentId: db.agent_id,
    identityCardPhoto: db.identity_card_photo || undefined,
  };
}

export function mapContract(db: any): Contract {
  return {
    id: db.id,
    contractNumber: db.contract_number,
    clientId: db.client_id,
    smartphoneId: db.smartphone_id,
    subscriptionDate: db.subscription_date,
    planType: db.plan_type as PaymentPlanType,
    initialDepositUsd: Number(db.initial_deposit_usd),
    installmentAmountUsd: Number(db.installment_amount_usd),
    totalInstallments: Number(db.total_installments),
    paymentDay: db.payment_day,
    status: db.status,
    agentId: db.agent_id,
  };
}

export function mapPayment(db: any): Payment {
  return {
    id: db.id,
    contractNumber: db.contract_number,
    clientId: db.client_id,
    amountUsd: Number(db.amount_usd),
    amountCdf: Number(db.amount_cdf),
    date: db.date,
    dueDate: db.due_date,
    paymentMethod: db.payment_method,
    status: db.status,
    transactionRef: db.transaction_ref,
    agentId: db.agent_id,
  };
}

export function mapDelayRecord(db: any): DelayRecord {
  return {
    id: db.id,
    contractNumber: db.contract_number,
    clientId: db.client_id,
    dueDate: db.due_date,
    amountUsd: Number(db.amount_usd),
    daysOverdue: Number(db.days_overdue),
    status: db.status,
  };
}

export const supabaseDB = {
  // GETTERS
  async getAgents(): Promise<Agent[]> {
    const { data, error } = await supabase.from('agents').select('*').order('name');
    if (error) throw error;
    return (data || []).map(mapAgent);
  },

  async getSmartphones(): Promise<Smartphone[]> {
    const { data, error } = await supabase.from('smartphones').select('*').order('brand');
    if (error) throw error;
    return (data || []).map(mapSmartphone);
  },

  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*').order('last_name');
    if (error) throw error;
    return (data || []).map(mapClient);
  },

  async getContracts(): Promise<Contract[]> {
    const { data, error } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapContract);
  },

  async getPayments(): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapPayment);
  },

  async getDelayRecords(): Promise<DelayRecord[]> {
    const { data, error } = await supabase.from('delay_records').select('*').order('due_date', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDelayRecord);
  },

  // INSERTIONS / MUTATIONS
  async addSmartphone(phone: Omit<Smartphone, 'id'>): Promise<Smartphone> {
    const { data, error } = await supabase
      .from('smartphones')
      .insert({
        brand: phone.brand,
        model: phone.model,
        value_usd: phone.valueUsd,
        imei: phone.imei,
      })
      .select()
      .single();

    if (error) throw error;
    return mapSmartphone(data);
  },

  async deleteSmartphone(id: string): Promise<void> {
    const { error } = await supabase.from('smartphones').delete().eq('id', id);
    if (error) throw error;
  },

  async addContractWithClient(
    clientData: Omit<Client, 'id' | 'registeredAt'>,
    contractData: Omit<Contract, 'id' | 'contractNumber' | 'clientId' | 'status'>
  ): Promise<{ client: Client; contract: Contract; payment: Payment }> {
    // 1. Generate contract number (using database transaction / simple atomic approach)
    // Fetch last contract number to generate next
    const { data: contracts, error: countError } = await supabase
      .from('contracts')
      .select('contract_number');
    if (countError) throw countError;
    const nextNum = (contracts?.length || 0) + 1;
    const contractNum = `AM-2026-${String(nextNum).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    // 2. Insert Client
    const { data: clientRes, error: clientError } = await supabase
      .from('clients')
      .insert({
        last_name: clientData.lastName,
        middle_name: clientData.middleName || null,
        first_name: clientData.firstName,
        phone_whatsapp: clientData.phoneWhatsApp,
        phone_urgency: clientData.phoneUrgency,
        address_num: clientData.addressNum,
        address_avenue: clientData.addressAvenue,
        neighborhood: clientData.neighborhood,
        city_commune: clientData.cityCommune,
        identity_doc_type: clientData.identityDocType,
        identity_doc_num: clientData.identityDocNum,
        identity_card_photo: clientData.identityCardPhoto || null,
        agent_id: clientData.agentId,
      })
      .select()
      .single();
    if (clientError) throw clientError;

    // 3. Insert Contract
    const { data: contractRes, error: contractError } = await supabase
      .from('contracts')
      .insert({
        contract_number: contractNum,
        client_id: clientRes.id,
        smartphone_id: contractData.smartphoneId,
        subscription_date: today,
        plan_type: contractData.planType,
        initial_deposit_usd: contractData.initialDepositUsd,
        installment_amount_usd: contractData.installmentAmountUsd,
        total_installments: contractData.totalInstallments,
        payment_day: contractData.paymentDay,
        agent_id: contractData.agentId,
        status: 'en_cours',
      })
      .select()
      .single();
    if (contractError) throw contractError;

    // 4. Insert Initial Deposit Payment
    const { data: paymentRes, error: paymentError } = await supabase
      .from('payments')
      .insert({
        contract_number: contractNum,
        client_id: clientRes.id,
        amount_usd: contractData.initialDepositUsd,
        amount_cdf: contractData.initialDepositUsd * 2800, // USD_TO_CDF
        date: new Date().toISOString(),
        due_date: today,
        payment_method: 'Espèces',
        status: 'Terminé',
        transaction_ref: `STORE-INIT-${contractNum}`,
        agent_id: contractData.agentId,
      })
      .select()
      .single();
    if (paymentError) throw paymentError;

    return {
      client: mapClient(clientRes),
      contract: mapContract(contractRes),
      payment: mapPayment(paymentRes),
    };
  },

  async addPayment(
    contractNumber: string,
    amountUsd: number,
    paymentMethod: Payment['paymentMethod'],
    agentId: string,
    transactionRef?: string
  ): Promise<Payment> {
    // Get contract detail to find clientId
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('client_id, status, initial_deposit_usd, installment_amount_usd, total_installments')
      .eq('contract_number', contractNumber)
      .single();
    if (contractError || !contract) throw new Error('Contrat introuvable');

    const todayStr = new Date().toISOString();
    const todayDateOnly = todayStr.split('T')[0];
    const ref = transactionRef || `MOMY-TRX-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        contract_number: contractNumber,
        client_id: contract.client_id,
        amount_usd: amountUsd,
        amount_cdf: amountUsd * 2800,
        date: todayStr,
        due_date: todayDateOnly,
        payment_method: paymentMethod,
        status: 'Terminé',
        transaction_ref: ref,
        agent_id: agentId,
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Recalculate Contract Status based on payments
    await this.recalculateContractStatus(contractNumber);

    return mapPayment(payment);
  },

  async recalculateContractStatus(contractNumber: string): Promise<void> {
    // Fetch contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('contract_number', contractNumber)
      .single();
    if (contractError || !contract) return;

    // Fetch all successful payments for this contract
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount_usd')
      .eq('contract_number', contractNumber)
      .eq('status', 'Terminé');
    if (paymentsError || !payments) return;

    const totalPaid = payments.reduce((acc, curr) => acc + Number(curr.amount_usd), 0);
    const totalSmartphoneValue =
      Number(contract.initial_deposit_usd) +
      Number(contract.installment_amount_usd) * Number(contract.total_installments);

    let newStatus = contract.status;
    if (totalPaid >= totalSmartphoneValue - 0.05) {
      newStatus = 'termine';
      // Mark delay records as resolved
      await supabase
        .from('delay_records')
        .update({ status: 'Résolu' })
        .eq('contract_number', contractNumber);
    } else if (contract.status === 'bloque' || contract.status === 'en_retard') {
      newStatus = 'en_cours';
      // Mark active delay record as resolved
      await supabase
        .from('delay_records')
        .update({ status: 'Résolu' })
        .eq('contract_number', contractNumber)
        .eq('status', 'Actif');
    }

    if (newStatus !== contract.status) {
      await supabase.from('contracts').update({ status: newStatus }).eq('id', contract.id);
    }
  },

  // ADMIN CREATE AGENT SUBORDINATE
  async createAgent(agent: Omit<Agent, 'id'>, password: string): Promise<string> {
    // Call the postgres function RPC 'create_agent_user'
    const { data, error } = await supabase.rpc('create_agent_user', {
      email: agent.email,
      password: password,
      name: agent.name,
      phone: agent.phone,
      code: agent.code,
      role: 'agent', // Always created as agent by admins
    });

    if (error) throw error;
    return data as string; // returns created user UUID
  },

  // SIMULATOR TRIGGER FOR KNOX BLOCK UNLOCKING
  async unlockKnoxContract(contractNumber: string): Promise<void> {
    // Mark delay records as resolved
    await supabase
      .from('delay_records')
      .update({ status: 'Résolu' })
      .eq('contract_number', contractNumber);

    // Set contract status back to en_cours
    await supabase
      .from('contracts')
      .update({ status: 'en_cours' })
      .eq('contract_number', contractNumber);
  },
};
