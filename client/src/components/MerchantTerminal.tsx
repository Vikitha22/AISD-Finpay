import React, { useState, useEffect } from 'react';
import { 
  Store, 
  QrCode, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Tag
} from 'lucide-react';
import { api } from '../services/api.js';
import { Merchant } from '../types.js';
import { useAuth } from '../context/AuthContext.js';

interface MerchantTerminalProps {
  onTriggerPayment: (merchantId: string) => void;
}

export const MerchantTerminal: React.FC<MerchantTerminalProps> = ({ onTriggerPayment }) => {
  const { student, wallet } = useAuth();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [chargeAmount, setChargeAmount] = useState<string>('120');

  useEffect(() => {
    api.getMerchants().then((data) => {
      setMerchants(data);
      if (data.length > 0) setSelectedMerchant(data[0]);
    });
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Merchant Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
                Campus Merchant Network & POS Terminal
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select an authorized campus merchant to simulate dynamic POS checkout and student wallet debit.
            </p>
          </div>

          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {merchants.length} Active Merchants
          </span>
        </div>

        {/* Merchant Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {merchants.map((m) => {
            const isSelected = selectedMerchant?.id === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMerchant(m)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/40 shadow-sm ring-1 ring-amber-500/30'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block mb-0.5">
                      {m.merchant_code}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base">{m.business_name}</h4>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {m.category}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Status: <strong className="text-emerald-600">Active</strong></span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerPayment(m.id);
                    }}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    Pay Here <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Virtual Merchant POS Terminal Screen */}
        {selectedMerchant && (
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white max-w-xl mx-auto border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="font-bold text-base">{selectedMerchant.business_name}</h4>
                  <span className="text-[11px] text-slate-400">Terminal ID: {selectedMerchant.merchant_code}</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300">
                {selectedMerchant.category}
              </span>
            </div>

            {/* Simulated QR Code & Payment Action */}
            <div className="text-center py-4 space-y-4">
              <div className="w-36 h-36 mx-auto bg-white rounded-2xl p-2.5 shadow-inner flex items-center justify-center">
                <QrCode className="w-full h-full text-slate-900" />
              </div>

              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Scan QR with student wallet or charge current user:
                </p>
                <div className="mt-1 font-bold text-white text-sm">
                  {student?.full_name} ({student?.student_id})
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onTriggerPayment(selectedMerchant.id)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-amber-500/20"
                >
                  Charge Student Wallet at {selectedMerchant.business_name}
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

