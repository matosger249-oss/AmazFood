import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Globe, Share } from 'lucide-react';

interface PWAInstallPromptProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export default function PWAInstallPrompt({ forceShow = false, onClose }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const isIos = /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase());

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      if (onClose) onClose();
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [onClose]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowPrompt(false);
      if (onClose) onClose();
    } else {
      // If we are forcing it to show but the browser doesn't support the prompt
      // (like iOS Safari or Chrome when it's not ready), we instruct the user.
      alert("O prompt automático de instalação não está disponível no seu navegador atual. Siga as instruções na tela.");
    }
  };

  const isVisible = showPrompt || forceShow;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
        <div className="bg-manaus-orange text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Download size={20} />
            <h2 className="font-bold text-lg">Instalar Aplicativo</h2>
          </div>
          <button 
            onClick={() => {
              setShowPrompt(false);
              if (onClose) onClose();
            }}
            className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Instale o <b>AmazFood</b> no seu celular ou computador para uma experiência mais rápida e integrada!
          </p>

          {!deferredPrompt && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm mt-2">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Globe size={14} className="text-manaus-orange" />
                Como instalar
              </h3>
              
              {isIos ? (
                <ol className="list-decimal list-inside text-slate-600 space-y-2">
                  <li>Toque no ícone de <b>Compartilhar</b> <Share size={14} className="inline mx-1" /> na barra inferior do Safari.</li>
                  <li>Role a lista e escolha "<b>Adicionar à Tela de Início</b>".</li>
                  <li>Pronto! O ícone do aplicativo aparecerá no seu celular.</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside text-slate-600 space-y-2">
                  <li>No seu navegador (Chrome/Edge), toque no ícone de <b>três pontos</b>.</li>
                  <li>Escolha "<b>Instalar aplicativo</b>" ou "<b>Adicionar à tela inicial</b>".</li>
                  <li>Se você estiver dentro de uma pré-visualização (iframe), <b>abra o link em uma nova aba primeiro</b>.</li>
                </ol>
              )}
            </div>
          )}

          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="w-full py-3.5 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2"
            >
              <Smartphone size={16} />
              Adicionar à Tela Inicial
            </button>
          )}

          {!deferredPrompt && (
            <button 
              onClick={() => {
                setShowPrompt(false);
                if (onClose) onClose();
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors mt-2"
            >
              Entendi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
