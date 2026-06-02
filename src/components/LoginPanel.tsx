import React, { useState } from "react";
import { Lock, Shield, Key, UserPlus } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";

interface LoginPanelProps {
  onLogin: (role: string) => void;
  onAddAuditLog: (acao: string, nivel: "sucesso" | "alerta" | "perigo", userOver?: string, roleOver?: string) => void;
}

export default function LoginPanel({ onLogin, onAddAuditLog }: LoginPanelProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      onAddAuditLog(`Login/Cadastro com Google efetuado`, "sucesso", userCredential.user.email || "Usuário Logado", "RESTAURANTE");
      onLogin("restaurante");
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Autenticação com Google cancelada.");
      } else {
        setError("Erro ao autenticar com Google. Tente novamente.");
      }
      onAddAuditLog(`Tentativa de autenticação com Google falha`, "perigo", "Desconhecido", "VISITANTE");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      if (isRegistering) {
        // Handle Registration
        const userCredential = await createUserWithEmailAndPassword(auth, username, password);
        onAddAuditLog(`Nova conta criada via Firebase`, "sucesso", userCredential.user.email || "Usuário Logado", "RESTAURANTE");
        onLogin("restaurante");
      } else {
        // Handle Login
        if (username === "superadmin" && password === "senha123") {
          onAddAuditLog("Login de sistema efetuado", "sucesso", "Dono (Super Admin)", "SUPER ADMIN");
          onLogin("super_admin");
        } else if (username === "admin" && password === "senha123") {
          onAddAuditLog("Login de sistema efetuado", "sucesso", "Administrador", "ADMIN");
          onLogin("admin");
        } else if (username === "lojista" && password === "senha123") {
          onAddAuditLog("Login de sistema efetuado", "sucesso", "Lojista", "RESTAURANTE");
          onLogin("restaurante");
        } else {
          // Try Firebase Auth
          const userCredential = await signInWithEmailAndPassword(auth, username, password);
          onAddAuditLog(`Login de sistema efetuado via Firebase`, "sucesso", userCredential.user.email || "Usuário Logado", "RESTAURANTE");
          onLogin("restaurante");
        }
      }
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Email de usuário ou senha incorretos.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este email já está sendo utilizado.");
      } else if (err.code === "auth/weak-password") {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError("Erro ao autenticar. Tente novamente.");
      }
      onAddAuditLog(`Tentativa de ${isRegistering ? "cadastro" : "login"} falha (Usuário: ${username})`, "perigo", "Desconhecido", "VISITANTE");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 bg-[#F0F2F5] flex flex-col items-center justify-center h-full">
      <div className="bg-white rounded-[32px] border p-12 max-w-sm w-full text-center space-y-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-20 h-20 bg-slate-900 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-slate-900/20">
          <Shield size={36} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isRegistering ? "Criar Conta" : "Login"}</h2>
          <p className="text-sm text-slate-500 font-medium">
            {isRegistering ? "Cadastre-se para gerenciar seu restaurante." : "Faça login para gerenciar sua conta."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5 text-left">
          <div className="space-y-1.5 focus-within:ring-1 focus-within:ring-manaus-orange rounded-xl">
            <label className="block text-[10px] font-bold uppercase text-slate-500 ml-1">Email</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              className="w-full text-sm font-medium p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-manaus-orange/50 focus:border-manaus-orange transition-all"
              placeholder="Digite seu email..."
            />
          </div>

          <div className="space-y-1.5 focus-within:ring-1 focus-within:ring-manaus-orange rounded-xl relative">
            <label className="block text-[10px] font-bold uppercase text-slate-500 ml-1">Senha de Acesso</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full text-sm font-medium p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-manaus-orange/50 focus:border-manaus-orange transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-600 font-medium flex items-center gap-2">
              <Lock size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full bg-slate-900 hover:bg-black text-white text-sm font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 mt-4 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isRegistering ? <UserPlus size={16} /> : <Key size={16} />}
            {isLoading ? "Processando..." : (isRegistering ? "Criar Minha Conta" : "Acessar Minha Conta")}
          </button>
          
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">OU</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>
          
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className={`w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <svg className="w-5 h-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continuar com o Google
          </button>
        </form>
        
        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-medium text-center space-y-2">
          {isRegistering ? (
            <p>
              Já possui uma conta?{" "}
              <button 
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError("");
                }} 
                className="text-manaus-orange font-bold hover:underline"
              >
                Faça login
              </button>
            </p>
          ) : (
            <p>
              Você é dono(a) de um restaurante?{" "}
              <button 
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setError("");
                }} 
                className="text-manaus-orange font-bold hover:underline"
              >
                Crie sua conta
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
