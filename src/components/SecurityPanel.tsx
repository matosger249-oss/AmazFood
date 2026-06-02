import React, { useState, useEffect } from "react";
import { 
  Shield, Key, Users, Lock, Unlock, Smartphone, Eye, EyeOff, 
  Layers, Bot, DollarSign, Sliders, Database, AlertOctagon, 
  Trash2, Settings, AlertCircle, CheckCircle, Plus, RefreshCw, X 
} from "lucide-react";

// Security Audit Log Entry type
export interface AuditLog {
  id: string;
  timestamp: string;
  usuario: string;
  role: string;
  ip: string;
  acao: string;
  nivel: "sucesso" | "alerta" | "perigo";
}

// Security Configuration types
export interface SecurityConfig {
  currentRole: "visitante" | "restaurante" | "moderador" | "suporte" | "admin" | "super_admin" | "cliente";
  activeRestaurantId: string; // If role is "restaurante", which one they manage
  is2faEnabled: boolean;
  ipWhitelist: string[];
  currentIp: string;
  isSecretUrlUnlocked: boolean;
  secretSlug: string;
  masterKey: string;
  aiAgentsEnabled: { [key: string]: boolean };
  aiBudgetLimit: number;
  adminEmail: string; // Active logged-in administrator e-mail
}

interface SecurityPanelProps {
  onAddAuditLog: (acao: string, nivel?: "sucesso" | "alerta" | "perigo", userOver?: string, roleOver?: string) => void;
  auditLogs: AuditLog[];
  config: SecurityConfig;
  onUpdateConfig: (newConfig: Partial<SecurityConfig>) => void;
  restaurants: any[];
  onTriggerMasterKey: (onSuccess: () => void, targetActionDescription: string) => void;
}

export default function SecurityPanel({
  onAddAuditLog,
  auditLogs,
  config,
  onUpdateConfig,
  restaurants,
  onTriggerMasterKey
}: SecurityPanelProps) {
  // Login form state
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "Fraca", color: "bg-red-500" });
  
  // 2FA login steps variables
  const [loginStep, setLoginStep] = useState<"credentials" | "2fa" | "success">("credentials");
  const [input2fa, setInput2fa] = useState("");
  const [rotating2faCode, setRotating2faCode] = useState("583 492");
  const [timer2fa, setTimer2fa] = useState(30);

  // Whitelisted IP management state
  const [newIpInput, setNewIpInput] = useState("");
  // Custom Secret URL settings
  const [secretSlugInput, setSecretSlugInput] = useState(config.secretSlug);
  // Master key update input
  const [masterKeyInput, setMasterKeyInput] = useState(config.masterKey);

  // Change Password Strength dynamic feedback
  useEffect(() => {
    let score = 0;
    if (passwordInput.length >= 8) score++;
    if (/[0-9]/.test(passwordInput)) score++;
    if (/[A-Z]/.test(passwordInput)) score++;
    if (/[^A-Za-z0-9]/.test(passwordInput)) score++;

    let text = "Muito Fraca";
    let color = "bg-red-500 w-1/4";
    if (score === 2) {
      text = "Média";
      color = "bg-amber-400 w-2/4";
    } else if (score === 3) {
      text = "Forte";
      color = "bg-indigo-500 w-3/4";
    } else if (score >= 4) {
      text = "Inviolável (Forte + Símbolo)";
      color = "bg-emerald-500 w-full";
    }
    setPasswordStrength({ score, text, color });
  }, [passwordInput]);

  // Google Authenticator dynamic 2FA rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimer2fa((prev) => {
        if (prev <= 1) {
          // Generate new fake code
          const fullCode = Math.floor(100000 + Math.random() * 900000).toString();
          setRotating2faCode(`${fullCode.substring(0, 3)} ${fullCode.substring(3, 6)}`);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCreateIp = () => {
    if (!newIpInput) return;
    if (config.ipWhitelist.includes(newIpInput)) {
      alert("IP já cadastrado!");
      return;
    }
    const updated = [...config.ipWhitelist, newIpInput];
    onUpdateConfig({ ipWhitelist: updated });
    onAddAuditLog(`IP ${newIpInput} adicionado à lista de confiança`, "sucesso");
    setNewIpInput("");
  };

  const handleRemoveIp = (ip: string) => {
    const updated = config.ipWhitelist.filter(x => x !== ip);
    onUpdateConfig({ ipWhitelist: updated });
    onAddAuditLog(`IP ${ip} removido da lista de confiança`, "alerta");
  };

  const verifySecretSlugAccess = () => {
    if (secretSlugInput.length < 3) {
      alert("A URL secreta precisa ter pelo menos 3 caracteres.");
      return;
    }
    onUpdateConfig({ secretSlug: secretSlugInput });
    onAddAuditLog(`Slug da URL secreta alterado para: /${secretSlugInput}`, "alerta");
    alert(`URL secreta restabelecida para: /${secretSlugInput}. Use para simular acessos diretos.`);
  };

  const saveNewMasterKey = () => {
    if (masterKeyInput.length < 4) {
      alert("Por favor, declare uma chave com pelo menos 4 dígitos");
      return;
    }
    onUpdateConfig({ masterKey: masterKeyInput });
    onAddAuditLog(`Nova chave mestre de segurança configurada`, "alerta");
    alert("Chave Mestre atualizada com sucesso!");
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      alert("Por favor, preencha as credenciais!");
      return;
    }

    if (passwordStrength.score < 2) {
      alert("Erro de Segurança: Sua senha é classificada como muito fraca! Utilize pelo menos 8 dígitos com números para prosseguir.");
      onAddAuditLog(`Tentativa de Login como Super Admin rejeitada (Senha muito Fraca)`, "perigo", emailInput, "Visitante");
      return;
    }

    // Step up to 2FA verification
    onAddAuditLog(`Etapa 1: Credenciais validadas. Solicitando Token 2FA Adicional`, "sucesso", emailInput, "Super Admin");
    setLoginStep("2fa");
  };

  const handle2faVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedInput = input2fa.replace(/\s+/g, "");
    const normalizedCode = rotating2faCode.replace(/\s+/g, "");

    // Accept rotating code or master override code (e.g., 999999) for testing ease
    if (normalizedInput === normalizedCode || normalizedInput === "999999" || normalizedInput === "123456") {
      setLoginStep("success");
      onUpdateConfig({ currentRole: "super_admin", isSecretUrlUnlocked: true, adminEmail: emailInput });
      onAddAuditLog(`Etapa 2: Autenticação Multi-Fator (2FA) aceita. Super Admin Autenticado`, "sucesso", emailInput, "Super Admin");
      alert("Acesso Concedido! Perfil de Super Administrador autenticado via Criptografia Robusta + 2FA.");
    } else {
      alert(`Token 2FA inválido! Digite o código de 6 dígitos ativo ou tente o token de emergência '123456' ou o código atual: ${rotating2faCode}`);
      onAddAuditLog(`Tentativa frustrada de 2FA incorreto`, "perigo", emailInput, "Visitante");
    }
  };

  const handleToggleAgent = (agentKey: string) => {
    onTriggerMasterKey(() => {
      const updated = { ...config.aiAgentsEnabled, [agentKey]: !config.aiAgentsEnabled[agentKey] };
      onUpdateConfig({ aiAgentsEnabled: updated });
      onAddAuditLog(`Agente de Inteligência Artificial [${agentKey}] alterado para ${updated[agentKey] ? 'ATIVO' : 'DESATIVADO'}`, "alerta");
    }, `Alterar status do ${agentKey}`);
  };

  const handleBudgetChange = (val: number) => {
    onUpdateConfig({ aiBudgetLimit: val });
  };

  const ipMatchesWhitelist = config.ipWhitelist.includes(config.currentIp);

  return (
    <div className="space-y-6" id="security_console_section">
      
      {/* SECTION 1: ROLE SWITCHER AND OVERVIEW */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-orange-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${ipMatchesWhitelist ? 'bg-indigo-500/10 text-indigo-400' : 'bg-red-500/10 text-red-400'}`}>
              <Shield size={24} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Console de Segurança de Dados AmazFood</h2>
              <p className="text-xs text-slate-400">Gerenciamento dinâmico de chaves, privilégios, redes seguras e logs de auditoria</p>
            </div>
          </div>

          <div className="flex gap-2 text-xs font-mono flex-wrap">
            {config.currentRole === "super_admin" && (
              <div className="px-2.5 py-1 rounded bg-red-950/40 text-rose-200 border border-red-500/30">
                👤 Sessão: <span className="font-sans font-bold text-white">{config.adminEmail || "darksektorseriesx@gmail.com"}</span> (Super Admin)
              </div>
            )}
            <div className={`px-2.5 py-1 rounded border ${ipMatchesWhitelist ? 'bg-emerald-500/10 text-emerald-400 border-emerald-900/30' : 'bg-red-500/10 text-red-400 border-red-900/30'}`}>
              {ipMatchesWhitelist ? `🟢 IP Autorizado: ${config.currentIp}` : `🔴 IP Bloqueado para Admin: ${config.currentIp}`}
            </div>
            <div className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Chave Mestre: <span className="text-orange-400 font-bold font-sans">Configurada</span>
            </div>
          </div>
        </div>

        {/* ROLE SIMULATOR ROW */}
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users size={12} className="text-indigo-400" /> Simular Perfis de Acesso de Segurança
          </h3>
          <p className="text-[11px] text-slate-400 leading-normal">
            Altere o papel ativo para ver como os limites de privilégio impedem ações perigosas e como o Super Administrador monitora o sistema.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
            
            {/* Cliente */}
            <button
              onClick={() => {
                onUpdateConfig({ currentRole: "cliente" });
                onAddAuditLog("Modificou papel ativo para Cliente", "sucesso", "Usuário Comum", "Cliente");
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                config.currentRole === "cliente"
                  ? "bg-slate-600 border-slate-500 text-white shadow-lg"
                  : "bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider">Cliente</div>
              <p className="text-[9px] mt-0.5 leading-tight opacity-80">Usuário do App.</p>
            </button>

            {/* Visitante */}
            <button
              onClick={() => {
                onUpdateConfig({ currentRole: "visitante" });
                onAddAuditLog("Modificou papel ativo para Visitante Externo", "alerta", "Anônimo", "Visitante");
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                config.currentRole === "visitante"
                  ? "bg-slate-600 border-slate-500 text-white shadow-lg"
                  : "bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider">Visitante</div>
              <p className="text-[9px] mt-0.5 leading-tight opacity-80">Apenas visualiza (Gate).</p>
            </button>

            {/* Restaurante */}
            <button
              onClick={() => {
                const defaultId = restaurants[0]?.id || "rest_tacaca_gisela";
                onUpdateConfig({ currentRole: "restaurante", activeRestaurantId: defaultId });
                onAddAuditLog("Acessou Painel restrito como Proprietário de Estabelecimento", "sucesso", "Dono do Restaurante", "Restaurante");
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                config.currentRole === "restaurante"
                  ? "bg-amber-600 border-amber-500 text-white shadow-lg"
                  : "bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider">Restaurante</div>
              <p className="text-[9px] mt-0.5 leading-tight opacity-80 font-sans">Edita apenas seu próprio perfil.</p>
            </button>

            {/* Moderador */}
            <button
              onClick={() => {
                onUpdateConfig({ currentRole: "moderador" });
                onAddAuditLog("Papel alterado para Moderador Técnico de Conteúdo", "sucesso", "Moderador 01", "Moderador");
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                config.currentRole === "moderador"
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg"
                  : "bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider">Moderador</div>
              <p className="text-[9px] mt-0.5 leading-tight opacity-80">Aprova novos cadastros.</p>
            </button>

            {/* Suporte */}
            <button
              onClick={() => {
                onUpdateConfig({ currentRole: "suporte" });
                onAddAuditLog("Acessou o app como Suporte da Plataforma", "sucesso", "Suporte 24h", "Suporte");
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                config.currentRole === "suporte"
                  ? "bg-purple-600 border-purple-500 text-white shadow-lg"
                  : "bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider">Suporte</div>
              <p className="text-[9px] mt-0.5 leading-tight opacity-80">Auxilia lojas em Manaus.</p>
            </button>

            {/* Admin comum */}
            <button
              onClick={() => {
                onTriggerMasterKey(() => {
                  onUpdateConfig({ currentRole: "admin" });
                  onAddAuditLog("Autenticado como Administrador de Configuração", "sucesso", "Admin Geral", "Admin");
                }, "Autenticar como Admin");
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                config.currentRole === "admin"
                  ? "bg-cyan-600 border-cyan-500 text-white shadow-lg"
                  : "bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider">Admin</div>
              <p className="text-[9px] mt-0.5 leading-tight opacity-80">Gerência de dados gerais.</p>
            </button>

            {/* Super Admin (Você) */}
            <button
              onClick={() => {
                if (config.currentRole === "super_admin") {
                  const confirmLogout = window.confirm(`Você está logado como Super Administrador (${config.adminEmail || "darksektorseriesx@gmail.com"}).\n\nDeseja deslogar (Logout/Sair) para ver o painel de login novamente e digitar o seu e-mail?`);
                  if (confirmLogout) {
                    onUpdateConfig({ currentRole: "visitante", adminEmail: "" });
                    setLoginStep("credentials");
                    setEmailInput("");
                    setPasswordInput("");
                    onAddAuditLog("Efetuou logout do perfil de Super Administrador", "alerta", config.adminEmail, "Super Admin");
                  }
                  return;
                }
                setLoginStep("credentials");
              }}
              className={`p-2.5 rounded-lg border text-left transition-all relative ${
                config.currentRole === "super_admin"
                  ? "bg-gradient-to-r from-red-600 to-orange-600 border-red-500 text-white shadow-lg"
                  : "bg-slate-900/90 border-red-950/40 text-red-400 hover:border-red-900/60"
              }`}
            >
              <span className="absolute -top-1 right-2 bg-red-500 text-white text-[7px] px-1 py-0.2 rounded font-bold">2FA</span>
              <div className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                <Lock size={10} /> Super Admin
              </div>
              <p className="text-[9px] mt-0.5 leading-tight opacity-80 text-red-200">Acesso Total + Cofre</p>
            </button>

          </div>
        </div>

        {/* RESTAURANTE ACTIVE ASSIGNMENT DROPDOWN FOR MERCHANT TESTING */}
        {config.currentRole === "restaurante" && (
          <div className="mt-4 p-3 bg-slate-800/50 border border-amber-500/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-1">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase tracking-wider text-amber-500 font-bold">Autenticação de Estabelecimento</span>
              <h4 className="text-xs font-bold text-white">Selecione o Restaurante que você administra</h4>
              <p className="text-[10px] text-slate-400">Atuando neste escopo, a listagem e os produtos serão filtrados apenas para a loja sob sua gerência.</p>
            </div>
            <div>
              <select
                value={config.activeRestaurantId}
                onChange={(e) => {
                  const rName = restaurants.find(r => r.id === e.target.value)?.nome || "Parceiro";
                  onUpdateConfig({ activeRestaurantId: e.target.value });
                  onAddAuditLog(`Alterou escopo de lojista para o restaurante: ${rName}`, "sucesso", `Dono de ${rName}`, "Restaurante");
                }}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded p-1.5 focus:border-amber-500 focus:outline-none"
              >
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>{r.nome} ({r.bairro})</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* SUPER ADMIN CREDENTIALS / 2FA AUTH PANEL (Only shown when user clicks Super Admin, and isn't logged in yet) */}
      {config.currentRole !== "super_admin" && loginStep !== "success" && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden animate-in zoom-in-95 duration-250">
          <div className="absolute top-0 right-0 p-2 text-[8px] bg-red-600 text-white font-mono uppercase font-bold rounded-bl">
            Área de Autenticação Segura
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-red-500/10 text-red-500 p-2.5 rounded-lg shrink-0">
              <Lock size={20} />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  🛡️ Autenticação Hierárquica do Super-Administrador
                </h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Para assumir o papel de <strong>Super Administrador (Você)</strong> e controlar finanças, backups e o Painel IA Oculto, é mandatório completar os 3 passos recomendados de segurança:
                </p>
              </div>

              {loginStep === "credentials" && (
                <form onSubmit={handleLoginSubmit} className="grid sm:grid-cols-2 gap-3 bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Passo 1: Credenciais de Proprietário</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">E-mail Cadastrado</label>
                    <input
                      type="email"
                      required
                      placeholder="seuemail@comermanaus.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-slate-400">Senha do Sistema (Forte)</label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[9px] text-slate-500 hover:text-white"
                      >
                        {showPassword ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordInput && (
                    <div className="sm:col-span-2 space-y-1 text-xs pt-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Força da Senha:</span>
                        <span className="font-bold text-white">{passwordStrength.text}</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${passwordStrength.color} transition-all duration-300`}></div>
                      </div>
                      <p className="text-[9px] text-slate-500">
                        *Senhas fortes contêm pelo menos 8 caracteres expressando letras maiúsculas, minúsculas, números e caracteres especiais.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="sm:col-span-2 text-center mt-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 rounded transition-all shadow-md"
                  >
                    Próximo Passo (Autenticação 2FA ADICIONAL)
                  </button>
                </form>
              )}

              {loginStep === "2fa" && (
                <div className="grid sm:grid-cols-2 gap-4 bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
                  {/* Fake app with rotating code */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between items-center text-center">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Smartphone size={13} className="text-cyan-400 rotate-12" />
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">Google Authenticator</span>
                    </div>

                    <div className="text-2xl font-mono tracking-widest text-[#FF6B35] font-black my-2">
                      {rotating2faCode}
                    </div>

                    <div className="w-full flex items-center justify-between text-[8px] text-slate-500">
                      <span>Protetor Ativo</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                        <span>Código expira em {timer2fa}s</span>
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handle2faVerify} className="space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Passo 2: Verificação Multifator</span>
                      <h4 className="text-xs font-bold text-white mt-1">Insira o Token de Segurança do Celular</h4>
                      <p className="text-[9px] text-slate-500 leading-relaxed mt-0.5">
                        Utilizamos 2FA ativo para blindar o portal contra vazamentos involuntários. Digite o código de 6 dígitos que está rodando no visor ao lado.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <input
                        type="text"
                        maxLength={7}
                        required
                        placeholder="000 000"
                        value={input2fa}
                        onChange={(e) => setInput2fa(e.target.value)}
                        className="w-full text-center tracking-widest font-mono font-bold bg-slate-950 border border-slate-850 rounded py-2 text-sm text-cyan-400 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setLoginStep("credentials")}
                        className="bg-slate-900 text-slate-400 border border-slate-800 text-[10px] px-2.5 py-1.5 rounded hover:text-white"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] py-1.5 rounded transition-all"
                      >
                        Validar Dispositivo Móvel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WHISTLELIST ACCESS BLOCKED SCREEN */}
      {config.currentRole === "super_admin" && !ipMatchesWhitelist && (
        <div className="bg-red-950/20 border-2 border-red-900/50 rounded-xl p-5 text-center space-y-3 relative overflow-hidden animate-in zoom-in-95">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="mx-auto w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
            <AlertOctagon size={24} className="animate-bounce" />
          </div>

          <div className="space-y-1 max-w-xl mx-auto">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Acesso Negado: Endereço IP {config.currentIp} Não Autorizado</h3>
            <p className="text-xs text-slate-400 leading-normal">
              O seu IP atual não está na lista de segurança pré-autorizada para gerenciar finanças e banco de dados do AmazFood. Apenas conexões sob IPs cadastrados (Casa/Escritório) podem operar essas abas fundamentais.
            </p>
          </div>

          <div className="flex justify-center gap-2 pt-1.5">
            <button
              onClick={() => {
                // Instantly let the tester add their fake current IP back to witness behavior
                const updated = [...config.ipWhitelist, config.currentIp];
                onUpdateConfig({ ipWhitelist: updated });
                onAddAuditLog(`IP Atual ${config.currentIp} auto-autorizado temporariamente no ambiente Sandbox`, "sucesso");
                alert("Simulado: IP adicionado à Whitelist!");
              }}
              className="bg-red-650 hover:bg-red-750 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors border border-red-500"
            >
              Liberar IP Atual (${config.currentIp})
            </button>
            <button
              onClick={() => onUpdateConfig({ currentRole: "visitante" })}
              className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 text-xs px-4 py-2 rounded-lg transition-colors"
            >
              Retornar para Perfil Visitante
            </button>
          </div>
        </div>
      )}

      {/* MAIN SECURITY WORKSPACE (Visible only when config allows access as super_admin, or admin/mod depending on context, and IP conforms or user matches whitelist/is authenticated) */}
      {config.currentRole === "super_admin" && ipMatchesWhitelist && (
        <div className="grid md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* COLUMN 1: SECURITY COFRE & EXTRA LAYERS */}
          <div className="md:col-span-2 space-y-6">
            
            {/* CARD 1: EXTRAS & WHITELISTS */}
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b">
                <Settings size={15} className="text-indigo-500" /> Configuração Fina de Proteções Físicas e IPs
              </h3>

              <div className="grid sm:grid-cols-2 gap-5">
                {/* IP Whitelist Control */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>🔒</span> Whitelist de IPs Cadastrados
                    </span>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Bloqueie conexões administrativas vindas de locais desconhecidos. Somente os IPs explicitamente cadastrados poderão abrir esta tela.
                    </p>

                    <div className="space-y-1 bg-white border rounded p-1.5 max-h-32 overflow-y-auto no-scrollbar pt-1.5">
                      {config.ipWhitelist.map(ip => (
                        <div key={ip} className="flex justify-between items-center bg-slate-50 hover:bg-indigo-50/50 p-1 px-2 rounded text-[10px] font-mono">
                          <span className="text-slate-700 flex items-center gap-1">
                            <span className={ip === config.currentIp ? "text-emerald-500" : "text-slate-400"}>●</span> {ip}
                            {ip === config.currentIp && <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1 rounded uppercase font-bold">Atual</span>}
                          </span>
                          <button
                            onClick={() => handleRemoveIp(ip)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                            title="Remover IP"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-1 pt-1.5 border-t">
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.10"
                      value={newIpInput}
                      onChange={(e) => setNewIpInput(e.target.value)}
                      className="border rounded px-2 py-1 text-xs font-mono flex-1 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={handleCreateIp}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded p-1 px-2 text-xs flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> Adicionar
                    </button>
                  </div>
                </div>

                {/* Secret URL / URL Oculta */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>🔗</span> URL Secreta Personalizada do Painel Master
                    </span>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Em vez do óbvio <code>/admin</code>, mude a rota para um link codificado aleatório para mitigar bruteforce e varreduras robóticas.
                    </p>

                    <div className="p-2 bg-indigo-50/50 border border-indigo-100 rounded text-slate-800 text-[11px] font-mono whitespace-nowrap overflow-x-auto no-scrollbar">
                      site.com/<span className="text-[#FF6B35] font-bold">{config.secretSlug}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-1 pt-2 border-t">
                    <input
                      type="text"
                      placeholder="painel-master-x7f93k"
                      value={secretSlugInput}
                      onChange={(e) => setSecretSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                      className="border rounded px-2 py-1 text-xs font-mono flex-1 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={verifySecretSlugAccess}
                      className="bg-[#0F172A] hover:bg-slate-800 text-white rounded p-1 px-3 text-xs font-bold"
                    >
                      Alterar Rota
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION: PAINEL OCULTO DA IA */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 text-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <Bot size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Painel IA Oculto - Orquestração de Agentes</h3>
                    <p className="text-[10px] text-slate-400">Gerencie o comportamento e controle financeiro das rotinas inteligentes do AmazFood</p>
                  </div>
                </div>
                <div className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-900/30 text-emerald-400 rounded-lg flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  Gasto Diário: R$1,42
                </div>
              </div>

              {/* Slider Orçamento */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-850 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Orçamento Limite Diário (Gemini APIs):</span>
                  <span className="text-emerald-400 font-mono font-bold">Até R${config.aiBudgetLimit},00</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={config.aiBudgetLimit}
                  onChange={(e) => handleBudgetChange(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-500 uppercase tracking-widest font-mono font-bold">
                  <span>R$5 / dia</span>
                  <span>R$50 / dia</span>
                  <span>R$100 / dia (Livre)</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                  *O ajuste de orçamento restringe programaticamente o número de chamadas adicionais do crawler de Discovery e resoluções do Verificador para mitigar custos de token indesejados.
                </p>
              </div>

              {/* 5 AI Agents Toggle Matrix */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                {[
                  { key: "ia_discovery", name: "Tainá: Descoberta", desc: "Varredura Google Maps/Insta", color: "text-cyan-400" },
                  { key: "ia_verifier", name: "Tainá: Verificador", desc: "Cruzamento Google Maps diário", color: "text-amber-400" },
                  { key: "ia_menuocr", name: "Tainá: OCR Cardápio", desc: "Extração de fotos/e-mails", color: "text-pink-400" },
                  { key: "ia_promo", name: "Tainá: Promoções", desc: "Mapeamento social Manaus", color: "text-orange-400" },
                  { key: "ia_chatbot", name: "Tainá: Client Assistant", desc: "Suporte interactivo chat", color: "text-indigo-400" }
                ].map(agent => (
                  <div key={agent.key} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-between hover:border-slate-750 transition-colors">
                    <div>
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`text-[10px] font-bold ${agent.color}`}>{agent.name}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${config.aiAgentsEnabled[agent.key] ? 'bg-emerald-505 bg-emerald-500 shadow-[0_0_4px_#10b981]' : 'bg-slate-600'}`}></div>
                      </div>
                      <p className="text-[8px] text-slate-400 leading-tight mb-2 h-7">{agent.desc}</p>
                    </div>

                    <button
                      onClick={() => handleToggleAgent(agent.key)}
                      className={`w-full py-1 rounded text-[9px] font-bold transition-all text-center ${
                        config.aiAgentsEnabled[agent.key]
                          ? "bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-slate-300"
                      }`}
                    >
                      {config.aiAgentsEnabled[agent.key] ? "Ativado" : "Desativado"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 3: DATABASE ENCRYPTION AUDIT & MASTER KEY */}
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b">
                <Database size={15} className="text-emerald-500" /> Criptografia de Banco e Chave Mestre de Segurança
              </h3>

              <div className="grid sm:grid-cols-2 gap-5">
                
                {/* Database Encryption Mock Display */}
                <div className="p-4 bg-slate-950 rounded-xl text-white font-mono text-[10px] space-y-3 relative overflow-hidden border border-slate-900 flex flex-col justify-between min-h-[170px]">
                  <div className="absolute top-1 right-2 uppercase font-bold text-[8px] bg-indigo-500 text-white px-1.5 rounded">
                    aes-256-gcm
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-indigo-400 font-bold flex items-center gap-1 tracking-wider uppercase text-[9px]">
                      <span>🗄️</span> Criptografia de Dados Sensíveis
                    </span>
                    <p className="text-slate-400 leading-normal text-[10px] font-sans">
                      Senhas, tokens API (WhatsApp, Gemini) e transações comerciais são criptografados com pbkdf2 e salting robusto no Postgres/Firestore.
                    </p>

                    <div className="bg-slate-900 border border-slate-850 p-2 rounded text-[9px] space-y-1">
                      <div><span className="text-pink-400">api_token_gemini:</span> <span className="text-slate-500">U2FsdGVkX18...</span></div>
                      <div><span className="text-pink-400">admin_password_hash:</span> <span className="text-slate-500">$pbkdf2-sha256$29000$WvJnD...</span></div>
                      <div><span className="text-pink-400">whatsapp_billing_key:</span> <span className="text-slate-500">e3b0c44298fc1c149af...</span></div>
                    </div>
                  </div>

                  <div className="text-[8px] text-slate-500 text-right font-sans pt-1">
                    ✔ Assinatura digital do banco ativa • 2026
                  </div>
                </div>

                {/* Master Key Configuration */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>🔑</span> Chave Mestre (Ações Críticas)
                    </span>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Algumas ações hipercríticas exigem a declaração de uma segunda senha independentemente de você já estar logado. Esse recurso impede cliques indesejados e danos acidentais por outros funcionários.
                    </p>
                    <p className="text-[10px] bg-slate-100 text-slate-600 p-1.5 px-2 border rounded font-bold">
                      Chave Mestre Padrão: <span className="text-[#FF6B35] font-mono">MANAUS_MASTER_2026</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t mt-3 flex gap-1">
                    <input
                      type="text"
                      placeholder="e.g. MINHA_SUPER_CHAVE"
                      value={masterKeyInput}
                      onChange={(e) => setMasterKeyInput(e.target.value)}
                      className="border rounded px-2.5 py-1 text-xs font-mono flex-1 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={saveNewMasterKey}
                      className="bg-[#0F172A] hover:bg-slate-800 text-white rounded p-1 px-3 text-xs font-bold whitespace-nowrap"
                    >
                      Salvar Chave
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMN 2: REAL-TIME AUDIT LOG FEED */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-5 space-y-4 shadow-sm h-full flex flex-col justify-between">
              <div className="space-y-1 pb-2 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span>📜</span> Logs de Auditoria do Sistema
                  </h3>
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">LIVE</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Histórico de todas as atividades críticas executadas por usuários, assessores e agentes automatizados.
                </p>
              </div>

              {/* Log List View */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto no-scrollbar py-2 flex-1 scroll-smooth">
                {auditLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-2.5 rounded-lg border text-[10px] space-y-1 bg-slate-50 transition-all hover:bg-slate-100/70 border-slate-100"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-slate-700 font-mono text-[9px]">{log.timestamp}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        log.nivel === "sucesso"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : log.nivel === "alerta"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                      }`}>
                        {log.role}
                      </span>
                    </div>

                    <p className="text-slate-800 leading-tight font-medium font-sans">
                      {log.acao}
                    </p>

                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium">
                      <span>Por: {log.usuario}</span>
                      <span className="font-mono text-[8px]">{log.ip}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t text-center text-[9px] text-slate-400">
                Os logs de auditoria são imutáveis e gravados sequencialmente.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* FOOTER SYSTEM WARNING BANNER */}
      <div className="p-3.5 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-xl text-left flex gap-3 items-start">
        <span className="text-base text-indigo-500">💡</span>
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold">Simulação de Segurança Multi-Nível no Ar</h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Todas as permissões das abas normais estão conectadas a este console! Se você estiver logado como <strong>Visitante</strong>, as mídias e abas de administração de lojas recusarão alterações. Se estiver como <strong>Restaurante</strong>, seus produtos estarão limitados apenas àquela loja específica. Apenas com privilégios de <strong>Super Administrador</strong> e rede IP cadastrada as ferramentas de alto impacto estarão disponíveis.
          </p>
        </div>
      </div>

    </div>
  );
}
