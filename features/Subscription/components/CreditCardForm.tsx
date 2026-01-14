
import React, { useState, useEffect, useRef } from 'react';
import { processCreditCardPayment } from '../services/subscriptionService';
import { Button } from '../../../components/ui/Button';
import { CreditCard, Calendar, Lock, User, FileText, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';
import { Restaurant } from '../../../types';
import { useAuth } from '../../Auth/context/AuthContext';

interface CreditCardFormProps {
  restaurant: Restaurant;
  onSuccess: () => void;
}

export const CreditCardForm: React.FC<CreditCardFormProps> = ({ restaurant, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Ref para verificar se componente ainda está montado (evita set state em componente desmontado)
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);
  
  const extractNumber = (addr: string) => {
     const match = addr.match(/,?\s*(\d+)/);
     return match ? match[1] : '';
  };

  const [formData, setFormData] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: '',
    cpfCnpj: '',
    email: user?.email || '',
    phone: restaurant.whatsappNumber || '',
    postalCode: '',
    addressNumber: extractNumber(restaurant.address || '')
  });

  const formatCardNumber = (v: string) => v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0, 19);
  const formatExpiry = (v: string) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1/$2').substring(0, 5);
  const formatCpfCnpj = (v: string) => {
    const val = v.replace(/\D/g, '');
    if (val.length <= 11) return val.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return val.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').substring(0, 18);
  };
  const formatPhone = (v: string) => {
     const val = v.replace(/\D/g, '');
     return val.replace(/^(\d{2})(\d)/, '($1) $2').substring(0, 15);
  };
  const formatCEP = (v: string) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formatted = value;
    
    if (name === 'number') formatted = formatCardNumber(value);
    if (name === 'expiry') formatted = formatExpiry(value);
    if (name === 'cvv') formatted = value.replace(/\D/g, '').substring(0, 4);
    if (name === 'holder') formatted = value.toUpperCase();
    if (name === 'cpfCnpj') formatted = formatCpfCnpj(value);
    if (name === 'phone') formatted = formatPhone(value);
    if (name === 'postalCode') formatted = formatCEP(value);

    setFormData(prev => ({ ...prev, [name]: formatted }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (formData.number.length < 16) { setErrorMsg("Número do cartão incompleto."); return; }
    if (formData.expiry.length < 5) { setErrorMsg("Data de validade inválida (MM/AA)."); return; }
    if (formData.cvv.length < 3) { setErrorMsg("CVV inválido."); return; }
    if (formData.cpfCnpj.length < 11) { setErrorMsg("CPF/CNPJ do titular é obrigatório."); return; }
    if (formData.postalCode.length < 9) { setErrorMsg("CEP é obrigatório."); return; }
    if (!formData.addressNumber) { setErrorMsg("Número do endereço do titular é obrigatório."); return; }

    setLoading(true);
    try {
        await processCreditCardPayment(restaurant.id, formData);
        if (isMounted.current) {
            onSuccess();
        }
    } catch (e: any) {
        console.error(e);
        if (isMounted.current) {
            setErrorMsg(e.message || "Pagamento recusado. Tente novamente.");
        }
    } finally {
        if (isMounted.current) {
            setLoading(false);
        }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
       
       <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3 text-xs text-gray-600 mb-2">
          <Lock size={16} className="text-green-600" />
          <span>Ambiente seguro. Dados criptografados.</span>
       </div>

       <div className="space-y-3">
           <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Número do Cartão</label>
              <div className="relative">
                 <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input type="text" name="number" value={formData.number} onChange={handleChange} placeholder="0000 0000 0000 0000" className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm" />
              </div>
           </div>

           <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nome no Cartão</label>
              <div className="relative">
                 <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input type="text" name="holder" value={formData.holder} onChange={handleChange} placeholder="COMO ESTÁ NO CARTÃO" className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm" />
              </div>
           </div>

           <div className="flex gap-3">
              <div className="flex-1">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Validade</label>
                 <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" name="expiry" value={formData.expiry} onChange={handleChange} placeholder="MM/AA" className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm" maxLength={5} />
                 </div>
              </div>
              <div className="w-24">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">CVV</label>
                 <input type="password" name="cvv" value={formData.cvv} onChange={handleChange} placeholder="123" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm text-center" maxLength={4} />
              </div>
           </div>

           <hr className="border-gray-100" />
           <p className="text-xs font-bold text-gray-700">Dados do Titular (Obrigatório)</p>

           <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">CPF/CNPJ</label>
              <div className="relative">
                 <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input type="text" name="cpfCnpj" value={formData.cpfCnpj} onChange={handleChange} placeholder="000.000.000-00" className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm" />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email</label>
                 <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg outline-none text-xs" placeholder="email@..." />
                 </div>
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Celular</label>
                 <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg outline-none text-xs" placeholder="(00) 0..." />
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">CEP</label>
                 <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg outline-none text-xs" placeholder="00000-000" />
                 </div>
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Número</label>
                 <input type="text" name="addressNumber" value={formData.addressNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-xs" placeholder="Nº da casa" />
              </div>
           </div>
       </div>

       {errorMsg && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-200 flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
             <AlertCircle size={16} className="shrink-0 mt-0.5" />
             <span className="font-bold">{errorMsg}</span>
          </div>
       )}

       <div className="pt-4 pb-2">
          <Button fullWidth size="lg" type="submit" isLoading={loading}>
             Confirmar Assinatura
          </Button>
       </div>
    </form>
  );
};
