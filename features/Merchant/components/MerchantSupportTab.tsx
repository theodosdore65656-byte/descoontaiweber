
import React, { useState } from 'react';
import { MessageCircle, Mail, ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface MerchantSupportTabProps {
  restaurantName: string;
}

export const MerchantSupportTab: React.FC<MerchantSupportTabProps> = ({ restaurantName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('descoontai@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Olá, sou da ${restaurantName} e preciso de suporte.`);
    window.open(`https://wa.me/5588999981618?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    window.open('mailto:descoontai@gmail.com');
  };

  return (
    <div className="animate-in fade-in pb-24">
       {/* Branding */}
       <div className="flex flex-col items-center text-center mt-6 mb-8">
          <div className="w-24 h-24 mb-4 bg-white rounded-full shadow-lg p-4 border border-gray-100 flex items-center justify-center">
             <img 
               src="https://github.com/WeberDG/descoontai/blob/main/simbolo.png?raw=true" 
               alt="Descoontaí" 
               className="w-full h-full object-contain"
             />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Central de Ajuda</h2>
          <p className="text-gray-500 max-w-xs mt-2">Precisa de suporte com sua loja ou tem alguma dúvida? Fale com a gente!</p>
       </div>

       <div className="space-y-4 max-w-md mx-auto">
          
          {/* WhatsApp Card */}
          <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <MessageCircle size={64} className="text-green-500" />
             </div>
             
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                   <div className="bg-green-100 p-2.5 rounded-xl text-green-600">
                      <MessageCircle size={24} />
                   </div>
                   <div>
                      <h3 className="font-bold text-gray-900">WhatsApp Suporte</h3>
                      <p className="text-xs text-gray-500">Atendimento prioritário</p>
                   </div>
                </div>
                
                <p className="text-lg font-mono font-bold text-gray-800 mb-4 tracking-wide">(88) 99998-1618</p>
                
                <Button 
                  fullWidth 
                  className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-lg shadow-green-200"
                  onClick={handleWhatsApp}
                >
                   Chamar no WhatsApp <ExternalLink size={16} className="ml-2" />
                </Button>
             </div>
          </div>

          {/* Email Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden hover:shadow-md transition-all">
             <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                   <Mail size={24} />
                </div>
                <div>
                   <h3 className="font-bold text-gray-900">E-mail Comercial</h3>
                   <p className="text-xs text-gray-500">Para assuntos administrativos</p>
                </div>
             </div>
             
             <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                <span className="text-sm font-medium text-gray-700 truncate mr-2">descoontai@gmail.com</span>
                <button 
                  onClick={handleCopyEmail}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copiar"
                >
                   {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
             </div>

             <Button 
               fullWidth 
               variant="secondary"
               className="border border-gray-200 bg-white hover:bg-gray-50"
               onClick={handleEmail}
             >
                Enviar E-mail
             </Button>
          </div>

          <div className="text-center pt-6">
             <p className="text-xs text-gray-400">Descoontaí © 2024 • Versão Parceiro 1.2</p>
          </div>

       </div>
    </div>
  );
};
