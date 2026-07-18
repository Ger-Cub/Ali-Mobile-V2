import React from 'react';
import { Client, Contract, Smartphone, USD_TO_CDF } from '../data/db';

interface ContractDocumentProps {
  contract: Contract;
  client: Client;
  smartphone: Smartphone;
  agentName: string;
}

export const ContractDocument: React.FC<ContractDocumentProps> = ({
  contract,
  client,
  smartphone,
  agentName
}) => {
  const formattedDate = new Date(contract.subscriptionDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const [day, month, year] = formattedDate.split('/');

  // Calculate total credit cost
  const totalCost = contract.initialDepositUsd + (contract.installmentAmountUsd * contract.totalInstallments);

  return (
    <div id={`contract-doc-${contract.contractNumber}`} className="print-page bg-white text-neutral-900 p-8 md:p-12 max-w-[800px] mx-auto border border-neutral-200 shadow-xl font-sans rounded-sm">
      {/* Header */}
      <div className="text-center mb-6 pb-6 border-b border-neutral-300">
        <h1 className="text-xl md:text-2xl font-bold font-display uppercase tracking-tight text-neutral-900">
          CONTRAT DE VENTE À CRÉDIT ET DE FINANCEMENT PARTICULIER – ALI MOBILE
        </h1>
        <div className="mt-4 flex flex-col sm:flex-row justify-between text-sm text-neutral-700 font-mono">
          <div>
            <span className="font-bold text-neutral-900">N° de Contrat :</span>{' '}
            <span className="underline decoration-indigo-500 font-bold text-lg text-black">{contract.contractNumber}</span>
          </div>
          <div className="mt-2 sm:mt-0">
            <span className="font-bold text-neutral-900">Date de souscription :</span>{' '}
            <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 rounded font-bold text-neutral-900">
              {day} / {month} / {year}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1 */}
      <div className="mb-6">
        <h2 className="text-base font-bold bg-neutral-100 px-3 py-1 text-neutral-900 border-l-4 border-black mb-3 uppercase tracking-wider font-display">
          1. IDENTIFICATION DES PARTIES
        </h2>
        
        <div className="text-sm space-y-4">
          <div className="bg-neutral-50 p-3 rounded border border-neutral-200">
            <p className="font-bold text-neutral-800">Le Fournisseur :</p>
            <p className="mt-1">
              La société <span className="font-semibold text-black">ALI MOBILE</span>, représentée par son agent de vente agréé <span className="font-semibold underline text-neutral-800">{agentName}</span>.
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Service Client Récupération : <span className="font-mono font-bold text-black">+243 824 444 298</span>
            </p>
          </div>

          <div className="p-3 border border-neutral-200 rounded">
            <p className="font-bold text-neutral-800 mb-2">Le Client (Acheteur) :</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
              <div>
                <span className="text-neutral-500 text-xs block">Nom, Postnom, Prénom</span>
                <span className="font-semibold text-neutral-900 capitalize text-sm">
                  {client.lastName} {client.middleName || ''} {client.firstName}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-neutral-500 text-xs block">Tél Principal (WhatsApp)</span>
                  <span className="font-mono font-semibold text-neutral-900 text-sm">{client.phoneWhatsApp}</span>
                </div>
                <div>
                  <span className="text-neutral-500 text-xs block">Tél d'urgence</span>
                  <span className="font-mono font-semibold text-neutral-900 text-sm">{client.phoneUrgency}</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <span className="text-neutral-500 text-xs block">Adresse physique complète</span>
                <span className="font-semibold text-neutral-900 text-sm">
                  N° {client.addressNum}, Avenue {client.addressAvenue}, Quartier {client.neighborhood}, Commune/Ville : {client.cityCommune}
                </span>
              </div>

              <div>
                <span className="text-neutral-500 text-xs block">Pièce d'identité fournie</span>
                <div className="flex items-center space-x-3 mt-1">
                  <label className="flex items-center space-x-1.5 text-xs text-neutral-800">
                    <input type="checkbox" checked={client.identityDocType === 'Carte d\'électeur'} readOnly className="rounded border-neutral-300 text-black focus:ring-black h-3.5 w-3.5" />
                    <span>Carte d'électeur</span>
                  </label>
                  <label className="flex items-center space-x-1.5 text-xs text-neutral-800">
                    <input type="checkbox" checked={client.identityDocType === 'Passeport'} readOnly className="rounded border-neutral-300 text-black focus:ring-black h-3.5 w-3.5" />
                    <span>Passeport</span>
                  </label>
                  <label className="flex items-center space-x-1.5 text-xs text-neutral-800">
                    <input type="checkbox" checked={client.identityDocType === 'Permis de conduire'} readOnly className="rounded border-neutral-300 text-black focus:ring-black h-3.5 w-3.5" />
                    <span>Permis</span>
                  </label>
                </div>
              </div>

              <div>
                <span className="text-neutral-500 text-xs block">Numéro de la pièce</span>
                <span className="font-mono font-semibold text-neutral-900 text-sm underline decoration-neutral-400">
                  {client.identityDocNum}
                </span>
                <span className="text-[10px] text-neutral-500 block italic">(Copie obligatoire jointe au contrat)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="mb-6">
        <h2 className="text-base font-bold bg-neutral-100 px-3 py-1 text-neutral-900 border-l-4 border-black mb-3 uppercase tracking-wider font-display">
          2. SPÉCIFICATIONS DE L'APPAREIL ET CONDITIONS FINANCIÈRES
        </h2>

        <div className="text-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border border-neutral-200 rounded">
            <div>
              <span className="text-neutral-500 text-xs block">Marque & Modèle du Smartphone</span>
              <span className="font-semibold text-neutral-950">{smartphone.brand} {smartphone.model}</span>
              <span className="text-xs text-neutral-600 block">Valeur : <span className="font-bold text-neutral-900">{smartphone.valueUsd} $</span> ({ (smartphone.valueUsd * USD_TO_CDF).toLocaleString() } CDF)</span>
            </div>
            <div>
              <span className="text-neutral-500 text-xs block">Numéro IMEI 1</span>
              <span className="font-mono font-bold text-neutral-900 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-150 block text-center mt-1">
                {smartphone.imei}
              </span>
            </div>
          </div>

          <div className="p-3 border border-neutral-200 rounded bg-neutral-50">
            <p className="font-bold text-neutral-800 mb-2 text-xs">Plan de Paiement Choisi par le Client (Cocher obligatoirement une case) :</p>
            
            <div className="space-y-4">
              {/* Option A */}
              <div className={`p-3 rounded border ${contract.planType === 'hebdo' ? 'border-black bg-white shadow-sm' : 'border-neutral-200 opacity-60'}`}>
                <label className="flex items-center space-x-2 font-bold text-neutral-950 text-xs uppercase mb-2">
                  <input type="checkbox" checked={contract.planType === 'hebdo'} readOnly className="rounded border-neutral-300 text-black h-4 w-4" />
                  <span>OPTION A : FORMULE HEBDOMADAIRE</span>
                </label>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-6 text-xs text-neutral-800 list-disc">
                  <li>Acompte Initial (50%) : <span className="font-bold text-black">{contract.planType === 'hebdo' ? contract.initialDepositUsd : (smartphone.valueUsd / 2)} $</span> <span className="text-neutral-500">(Payés ce jour)</span></li>
                  <li>Montant de la traite : <span className="font-bold text-black">{contract.planType === 'hebdo' ? contract.installmentAmountUsd : (smartphone.valueUsd / 2 / 8)} $</span> par semaine</li>
                  <li>Nombre d'échéances : <span className="font-semibold">8 semaines</span></li>
                  <li>Jour de paiement fixe : <span className="font-semibold text-red-600">Chaque samedi avant minuit</span></li>
                </ul>
              </div>

              {/* Option B */}
              <div className={`p-3 rounded border ${contract.planType === 'mensuel' ? 'border-black bg-white shadow-sm' : 'border-neutral-200 opacity-60'}`}>
                <label className="flex items-center space-x-2 font-bold text-neutral-950 text-xs uppercase mb-2">
                  <input type="checkbox" checked={contract.planType === 'mensuel'} readOnly className="rounded border-neutral-300 text-black h-4 w-4" />
                  <span>OPTION B : FORMULE MENSUELLE</span>
                </label>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-6 text-xs text-neutral-800 list-disc">
                  <li>Acompte Initial (50%) : <span className="font-bold text-black">{contract.planType === 'mensuel' ? contract.initialDepositUsd : (smartphone.valueUsd / 2)} $</span> <span className="text-neutral-500">(Payés ce jour)</span></li>
                  <li>Montant de la traite : <span className="font-bold text-black">{contract.planType === 'mensuel' ? contract.installmentAmountUsd : (smartphone.valueUsd / 2 / 2)} $</span> par mois</li>
                  <li>Nombre d'échéances : <span className="font-semibold">2 mois</span></li>
                  <li>Jour de paiement fixe : <span className="font-semibold">Le {contract.planType === 'mensuel' ? contract.paymentDay : '____'} de chaque mois</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 */}
      <div className="mb-6">
        <h2 className="text-base font-bold bg-neutral-100 px-3 py-1 text-neutral-900 border-l-4 border-black mb-3 uppercase tracking-wider font-display flex items-center">
          <span className="mr-1.5 text-amber-500">⚠</span> 3. CONDITIONS GÉNÉRALES ET POLITIQUE DE BLOCAGE (À lire attentivement)
        </h2>

        <div className="text-[11px] leading-relaxed text-neutral-700 space-y-2 pl-1">
          <p>
            <span className="font-bold text-neutral-900">1. Propriété restrictive :</span> Le smartphone reste la propriété exclusive d'ALI MOBILE jusqu'au paiement de la toute dernière mensualité. Le client n'a pas le droit de vendre, de gager ou de donner le téléphone avant la fin du contrat.
          </p>
          <p>
            <span className="font-bold text-neutral-900">2. Technologie de Sécurité Knox de Samsung :</span> Le client reconnaît et accepte expressément que le téléphone est équipé du logiciel de sécurité Knox de Samsung. Ce système suit l'état des paiements en temps réel.
          </p>
          <p className="bg-red-50 p-1.5 rounded border border-red-150 text-neutral-900 font-medium">
            <span className="font-bold text-red-700">3. Règle stricte du Blocage automatique à J+1 :</span> En cas de non-paiement à la date convenue (le samedi pour l'hebdomadaire, ou la date fixée pour le mensuel), <span className="font-bold underline">le téléphone se verrouillera automatiquement le lendemain matin à 08h00</span>.
          </p>
          <p>
            <span className="font-bold text-neutral-900">4. Conséquences du verrouillage :</span> Lorsque le téléphone est bloqué, toutes les fonctionnalités (appels, messages, WhatsApp, photos, applications) sont inaccessibles. L'appareil affichera uniquement l'écran de paiement et le numéro du service client d'ALI MOBILE (<span className="font-bold text-black font-mono">+243 824 444 298</span>).
          </p>
          <p>
            <span className="font-bold text-neutral-900">5. Déblocage :</span> Le déblocage s'effectue automatiquement par Internet dans les 2 minutes suivant la réception du paiement par Mobile Money.
          </p>
          <p>
            <span className="font-bold text-neutral-900">6. Tentative de Fraude et Poursuites :</span> Toute tentative de piratage, de réinitialisation forcée (Hard Reset) ou de modification du système pour contourner Knox de Samsung entraînera le blocage définitif de l'appareil sans remboursement de l'acompte, ainsi que des poursuites judiciaires pour vol et fraude électronique.
          </p>
        </div>
      </div>

      {/* Section 4 */}
      <div>
        <h2 className="text-base font-bold bg-neutral-100 px-3 py-1 text-neutral-900 border-l-4 border-black mb-3 uppercase tracking-wider font-display">
          4. ENGAGEMENT ET SIGNATURES
        </h2>

        <div className="text-xs text-neutral-800 space-y-3">
          <p className="leading-relaxed">
            Le Client déclare avoir assisté à la démonstration de configuration du logiciel Knox de Samsung en boutique. Il comprend et accepte qu'en cas de retard de paiement, son outil de travail ou de communication sera suspendu par le système informatique sans préavis.
          </p>
          
          <p className="font-mono text-neutral-600 italic">
            Fait à <span className="font-bold text-black underline">Goma</span>, le <span className="font-bold text-black underline">{day} / {month} / {year}</span> en deux exemplaires originaux.
          </p>

          <div className="bg-neutral-50 p-3 rounded border border-neutral-200 mt-2">
            <span className="text-neutral-500 text-[10px] block uppercase font-bold tracking-wider mb-1">Mention manuscrite du Client (Requis) :</span>
            <p className="font-display text-sm italic font-semibold text-indigo-900 bg-white px-2 py-1.5 border border-dashed border-indigo-300 rounded text-center" style={{ fontFamily: "'Space Grotesk', cursive" }}>
              "Lu et approuvé, j'accepte le blocage en cas de non-paiement"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 mt-2">
            <div className="border border-neutral-200 rounded p-4 flex flex-col justify-between h-[150px] relative bg-white">
              <span className="font-bold text-neutral-900 border-b border-neutral-100 pb-1 text-center">Signature du Client</span>
              
              {/* Fake client signature */}
              <div className="absolute inset-x-0 bottom-8 flex justify-center items-center pointer-events-none">
                <span className="font-serif italic text-2xl text-blue-800 opacity-80 rotate-[-6deg] select-none" style={{ fontFamily: "cursive" }}>
                  {client.firstName} {client.lastName}
                </span>
              </div>
              
              <span className="text-[10px] text-neutral-400 text-center italic mt-auto">Signé électroniquement</span>
            </div>

            <div className="border border-neutral-200 rounded p-4 flex flex-col justify-between h-[150px] relative bg-neutral-50 overflow-hidden">
              <span className="font-bold text-neutral-900 border-b border-neutral-100 pb-1 text-center">Pour la société ALI MOBILE</span>
              
              {/* Fake Ali Mobile stamp and agent signature */}
              <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                {/* Round Stamp */}
                <div className="w-24 h-24 rounded-full border-4 border-double border-red-600 flex flex-col justify-center items-center text-red-600 font-bold text-[8px] text-center rotate-[12deg] opacity-70 p-1 select-none">
                  <div className="border-b border-red-600 w-full pb-0.5">ALI MOBILE</div>
                  <div className="text-[6px] py-0.5">GOMA — RDC</div>
                  <div className="border-t border-red-600 w-full pt-0.5">AGRÉÉ</div>
                </div>
                {/* Agent signature */}
                <div className="absolute font-serif italic text-xl text-indigo-800 opacity-70 rotate-[-15deg] select-none left-12 bottom-12" style={{ fontFamily: "cursive" }}>
                  {agentName.split(' ')[0]}
                </div>
              </div>

              <span className="text-[10px] text-neutral-400 text-center italic mt-auto">Signature et cachet de l'agent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
