import React from 'react';
import { FileText, X, ShieldCheck } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Termos e Privacidade">
      <div className="h-[60vh] overflow-y-auto pr-2 text-sm text-gray-600 space-y-4 text-justify">
        
        <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 mb-4">
           <h3 className="font-bold text-brand-800 flex items-center gap-2 mb-2">
             <ShieldCheck size={18} /> Resumo Legal
           </h3>
           <p className="text-xs text-brand-700">
             O Descoontaí atua como intermediador de negócios. Pagamentos são processados de forma segura pelo Asaas. Seus dados são protegidos conforme a LGPD.
           </p>
        </div>

        <section>
          <h3 className="font-bold text-gray-900 mb-2">1. Termos de Uso</h3>
          <p>
            Bem-vindo ao Descoontaí. Ao utilizar nosso aplicativo, você concorda que somos uma plataforma de intermediação entre usuários e estabelecimentos parceiros.
            Não somos responsáveis pelo preparo, qualidade ou entrega dos produtos, sendo esta responsabilidade exclusiva do estabelecimento escolhido.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-gray-900 mb-2">2. Pagamentos e Reembolsos</h3>
          <p>
            Todas as transações financeiras são processadas pelo gateway de pagamento <strong>Asaas (Instituição de Pagamento)</strong>. 
            O Descoontaí não armazena dados completos de cartão de crédito em seus servidores.
            Em caso de cancelamento ou problemas com o pedido, o estorno deve ser solicitado diretamente ao estabelecimento ou via suporte do app, sujeito às regras bancárias de prazo (até 7 dias úteis para cartão).
          </p>
        </section>

        <section>
          <h3 className="font-bold text-gray-900 mb-2">3. Política de Privacidade (LGPD)</h3>
          <p>
            Coletamos apenas os dados necessários para a prestação do serviço: Nome, Telefone (para contato do entregador) e Endereço.
            Sua localização é utilizada apenas para listar lojas próximas e calcular frete.
            Você pode solicitar a exclusão da sua conta e dados a qualquer momento através do menu "Ajuda" ou entrando em contato com nosso suporte.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-gray-900 mb-2">4. Responsabilidades do Usuário</h3>
          <p>
            É proibido utilizar o app para fins ilícitos, trotes ou fraudes. O usuário é responsável por manter seus dados de contato e endereço atualizados para garantir o sucesso da entrega.
            O uso indevido da plataforma poderá acarretar no bloqueio ou exclusão da conta.
          </p>
        </section>

        <div className="pt-4 text-xs text-gray-400 text-center">
           Última atualização: Janeiro de 2026
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 mt-4">
        <Button fullWidth onClick={onClose}>
          Li e Concordo
        </Button>
      </div>
    </Modal>
  );
};