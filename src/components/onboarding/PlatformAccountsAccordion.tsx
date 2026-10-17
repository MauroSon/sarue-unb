import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Button, Input } from '@/components/ui';
import { useCredentials } from '../../hooks/useCredentials';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  GraduationCap,
  BookOpen,
  Video,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import type { PlatformType } from '@/core';

export interface PlatformAccountsAccordionProps {
  /** Título opcional do bloco (o onboarding usa; a Settings tem PageHeader próprio) */
  title?: string;
  subtitle?: string;
  /** Registra a ação de concluir (usado pelo footer do wizard no onboarding) */
  registerFinish?: (finish: () => Promise<void>) => void;
  /** Estado para o chrome do wizard: há conta conectada? está ocupado? */
  onActiveChange?: (state: { connected: boolean; busy: boolean }) => void;
}

/**
 * "As gavetas do cofre": cada plataforma é um adesivo que expande o formulário
 * inline; conectado, fica verde-pastel com check estampado. Conectou uma,
 * abre a próxima pendente. Compartilhado entre onboarding (passo 4) e Settings.
 */
export const PlatformAccountsAccordion: React.FC<PlatformAccountsAccordionProps> = ({
  title,
  subtitle,
  registerFinish,
  onActiveChange,
}) => {
  const { saveSigaa, saveAprender3, saveTeams, clearPlatform, allCredentials, isLoading, error } =
    useCredentials();
  const reduced = useReducedMotion();

  // Adesivo aberto no momento (accordion: sempre um aberto)
  const [openPlatform, setOpenPlatform] = useState<PlatformType | null>('sigaa');

  // Campos SIGAA
  const [sigaaMatricula, setSigaaMatricula] = useState('');
  const [sigaaSenha, setSigaaSenha] = useState('');
  // Estado de conexão nasce do cofre (cache do hook): navegar entre telas desmonta
  // este componente, e ao remontar o adesivo precisa continuar "Conectado".
  const [sigaaSaved, setSigaaSaved] = useState(() => Boolean(allCredentials.sigaa));
  const [sigaaSuccessMsg, setSigaaSuccessMsg] = useState<string | null>(null);

  // Campos Aprender 3
  const [aprenderCpf, setAprenderCpf] = useState('');
  const [aprenderSenha, setAprenderSenha] = useState('');
  const [aprenderSaved, setAprenderSaved] = useState(() => Boolean(allCredentials.aprender3));
  const [aprenderSuccessMsg, setAprenderSuccessMsg] = useState<string | null>(null);

  // Teams
  const [teamsConnected, setTeamsConnected] = useState(
    () => Boolean(allCredentials.teams?.isConnected),
  );
  const [teamsSuccessMsg, setTeamsSuccessMsg] = useState<string | null>(null);

  // Feedback comum
  const [formError, setFormError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const allConnected = sigaaSaved && aprenderSaved && teamsConnected;

  // Um adesivo aberto por vez. Com tudo conectado, fechar o aberto é permitido
  // (todos minimizados). Aprender 3 e Teams exigem o SIGAA conectado primeiro.
  const togglePlatform = (id: PlatformType) => {
    setFormError(null);
    setOpenPlatform((cur) => {
      if (cur !== id) {
        if (id !== 'sigaa' && !sigaaSaved) return cur;
        return id;
      }
      return allConnected ? null : cur;
    });
  };

  const handleConnectSigaa = async () => {
    setFormError(null);
    if (!sigaaMatricula.trim()) {
      setFormError('Informe sua matrícula do SIGAA.');
      return;
    }
    if (!sigaaSenha) {
      setFormError('Informe sua senha do SIGAA.');
      return;
    }
    setIsVerifying(true);
    try {
      const res = await saveSigaa({ matricula: sigaaMatricula.trim(), senha: sigaaSenha });
      if (res.success) {
        setSigaaSaved(true);
        setSigaaSuccessMsg(res.detail || 'Conectado ao SIGAA com sucesso!');
        // Gaveta seguinte: SIGAA fica marcado como conectado e abre a próxima pendente
        setOpenPlatform(!aprenderSaved ? 'aprender3' : !teamsConnected ? 'teams' : 'sigaa');
      } else {
        setSigaaSaved(false);
        setSigaaSuccessMsg(null);
        setFormError(res.error || 'Falha ao autenticar no SIGAA. Verifique matrícula e senha.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnectSigaa = async () => {
    setFormError(null);
    setSigaaSuccessMsg(null);
    if (aprenderSaved || teamsConnected) {
      setFormError('Desconecte o Aprender 3 e o Teams antes de desconectar o SIGAA.');
      return;
    }
    setIsVerifying(true);
    try {
      await clearPlatform('sigaa');
      setSigaaSaved(false);
    } catch {
      setFormError('Não foi possível desconectar do SIGAA.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConnectAprender3 = async () => {
    setFormError(null);
    if (!aprenderCpf.trim()) {
      setFormError('Informe seu CPF do Aprender 3.');
      return;
    }
    if (!aprenderSenha) {
      setFormError('Informe sua senha do Aprender 3.');
      return;
    }
    setIsVerifying(true);
    try {
      const res = await saveAprender3({ cpf: aprenderCpf.trim(), senha: aprenderSenha });
      if (res.success) {
        setAprenderSaved(true);
        setAprenderSuccessMsg(res.detail || 'Conectado ao Aprender 3 com sucesso!');
        setOpenPlatform(!teamsConnected ? 'teams' : 'aprender3');
      } else {
        setAprenderSaved(false);
        setAprenderSuccessMsg(null);
        setFormError(res.error || 'Falha ao autenticar no Aprender 3. Verifique CPF e senha.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnectAprender3 = async () => {
    setFormError(null);
    setAprenderSuccessMsg(null);
    setIsVerifying(true);
    try {
      await clearPlatform('aprender3');
      setAprenderSaved(false);
    } catch {
      setFormError('Não foi possível desconectar do Aprender 3.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleTeams = async () => {
    setFormError(null);
    setTeamsSuccessMsg(null);
    if (teamsConnected) {
      setTeamsConnected(false);
      await clearPlatform('teams');
    } else {
      setIsVerifying(true);
      try {
        const res = await saveTeams({ isConnected: true });
        if (res.success) {
          setTeamsConnected(true);
          setTeamsSuccessMsg(res.detail || 'Microsoft Teams conectado com sucesso!');
        } else {
          setFormError(res.error || 'Falha ao autenticar no Microsoft Teams.');
        }
      } finally {
        setIsVerifying(false);
      }
    }
  };

  // Conclui salvando o que estiver preenchido e não salvo no adesivo aberto
  const handleFinish = async () => {
    setFormError(null);

    if (openPlatform === 'sigaa' && (sigaaMatricula || sigaaSenha) && !sigaaSaved) {
      if (!sigaaMatricula.trim()) {
        setFormError('Informe sua matrícula do SIGAA.');
        return;
      }
      if (!sigaaSenha) {
        setFormError('Informe sua senha do SIGAA.');
        return;
      }
      setIsVerifying(true);
      try {
        const res = await saveSigaa({ matricula: sigaaMatricula.trim(), senha: sigaaSenha });
        if (!res.success) {
          setFormError(res.error || 'Falha ao autenticar no SIGAA.');
          return;
        }
        setSigaaSaved(true);
      } finally {
        setIsVerifying(false);
      }
    } else if (openPlatform === 'aprender3' && (aprenderCpf || aprenderSenha) && !aprenderSaved) {
      if (!aprenderCpf.trim()) {
        setFormError('Informe seu CPF do Aprender 3.');
        return;
      }
      if (!aprenderSenha) {
        setFormError('Informe sua senha do Aprender 3.');
        return;
      }
      setIsVerifying(true);
      try {
        const res = await saveAprender3({ cpf: aprenderCpf.trim(), senha: aprenderSenha });
        if (!res.success) {
          setFormError(res.error || 'Falha ao autenticar no Aprender 3.');
          return;
        }
        setAprenderSaved(true);
      } finally {
        setIsVerifying(false);
      }
    } else if (openPlatform === 'teams' && teamsConnected) {
      await saveTeams({ isConnected: true });
    }
  };

  const anyConnected = sigaaSaved || aprenderSaved || teamsConnected;

  // Estado sobe para o footer do wizard (botão Entrar no Aggregator)
  React.useEffect(() => {
    onActiveChange?.({ connected: anyConnected, busy: isLoading || isVerifying });
  }, [anyConnected, isLoading, isVerifying, onActiveChange]);

  // Ação de concluir registrada a cada render (fecha sobre o estado atual)
  React.useEffect(() => {
    registerFinish?.(handleFinish);
  });

  const platformRows: {
    id: PlatformType;
    name: string;
    hint: string;
    isSaved: boolean;
    block: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'sigaa',
      name: 'SIGAA',
      hint: 'Matrícula e senha',
      isSaved: sigaaSaved,
      block: 'bg-neo-green',
      icon: <GraduationCap className="w-5 h-5 text-black stroke-[2.5]" />,
    },
    {
      id: 'aprender3',
      name: 'Aprender 3',
      hint: 'CPF e senha',
      isSaved: aprenderSaved,
      block: 'bg-platform-aprender3',
      icon: <BookOpen className="w-5 h-5 text-black stroke-[2.5]" />,
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      hint: 'Login interativo',
      isSaved: teamsConnected,
      block: 'bg-platform-teams',
      icon: <Video className="w-5 h-5 text-black stroke-[2.5]" />,
    },
  ];

  return (
    <div className="w-full">
      {/* Título opcional (onboarding usa; Settings tem PageHeader próprio) */}
      {title ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 26, delay: 0.05 }}
          className="mb-5"
        >
          <h2 className="text-2xl font-black tracking-tight text-black">{title}</h2>
          {subtitle ? (
            <p className="text-sm font-medium text-neutral-600 mt-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              {subtitle}
            </p>
          ) : null}
        </motion.div>
      ) : null}

      {/* Lista de plataformas: adesivos expansíveis */}
      <div className="space-y-3">
        {platformRows.map((p, i) => {
          const isOpen = openPlatform === p.id;
          const isLocked = p.id !== 'sigaa' && !sigaaSaved;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 26, delay: 0.12 + i * 0.08 }}
              className={`border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_#000] overflow-hidden ${p.isSaved ? 'bg-pastel-green' : 'bg-white'} ${isLocked ? 'opacity-60' : ''}`}
            >
              {/* Cabeçalho do adesivo */}
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${p.id}-form`}
                onClick={() => {
                  if (!isLocked) togglePlatform(p.id);
                }}
                title={isLocked ? 'Conecte o SIGAA primeiro' : undefined}
                aria-disabled={isLocked || undefined}
                className={`w-full flex items-center gap-3 p-4 text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2 transition-colors duration-150 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-black/[0.03]'}`}
              >
                <div className={`w-9 h-9 shrink-0 ${p.block} border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] flex items-center justify-center`}>
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-black">{p.name}</div>
                  <div className="text-xs font-medium text-neutral-600 truncate">
                    {p.isSaved ? 'Conectado' : isLocked ? 'Conecte o SIGAA primeiro' : p.hint}
                  </div>
                </div>
                {p.isSaved ? (
                  <motion.span
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-ink-success stroke-[2.5]" />
                  </motion.span>
                ) : null}
                {isLocked ? (
                  <Lock className="w-4 h-4 stroke-[2.5] text-neutral-500" />
                ) : (
                  <ChevronDown
                    className={`w-4 h-4 stroke-[2.5] text-neutral-700 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {/* Formulário expandido */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="form"
                    id={`${p.id}-form`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-3 border-t-2 border-black/10 space-y-3">
                      {p.id === 'sigaa' && (
                        <>
                          <Input
                            label="Matrícula SIGAA"
                            placeholder="Ex: 202012345"
                            value={sigaaMatricula}
                            onChange={(e) => {
                              setSigaaMatricula(e.target.value);
                              setSigaaSaved(false);
                              setSigaaSuccessMsg(null);
                            }}
                            disabled={isLoading || isVerifying}
                          />
                          <Input
                            type="password"
                            label="Senha SIGAA"
                            placeholder="Senha do SIGAA"
                            value={sigaaSenha}
                            onChange={(e) => {
                              setSigaaSenha(e.target.value);
                              setSigaaSaved(false);
                              setSigaaSuccessMsg(null);
                            }}
                            disabled={isLoading || isVerifying}
                          />
                          {sigaaSaved && sigaaSuccessMsg ? (
                            <div className="p-3 bg-pastel-green text-black border-2 border-black rounded-lg text-xs font-bold flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-ink-success stroke-[2.5] shrink-0" />
                              <span>{sigaaSuccessMsg}</span>
                            </div>
                          ) : null}
                          <div className="flex justify-end pt-1">
                            <Button
                              size="md"
                              variant={sigaaSaved ? 'destructive' : 'default'}
                              isLoading={isVerifying}
                              disabled={isVerifying || isLoading}
                              onClick={sigaaSaved ? handleDisconnectSigaa : handleConnectSigaa}
                            >
                              {sigaaSaved ? (
                                <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                              )}
                              <span>
                                {isVerifying
                                  ? 'Validando conexão...'
                                  : sigaaSaved
                                  ? 'Desconectar do SIGAA'
                                  : 'Conectar SIGAA'}
                              </span>
                            </Button>
                          </div>
                        </>
                      )}

                      {p.id === 'aprender3' && (
                        <>
                          <Input
                            label="CPF (somente números ou formatado)"
                            placeholder="Ex: 000.000.000-00"
                            value={aprenderCpf}
                            onChange={(e) => {
                              setAprenderCpf(e.target.value);
                              setAprenderSaved(false);
                              setAprenderSuccessMsg(null);
                            }}
                            disabled={isLoading || isVerifying}
                          />
                          <Input
                            type="password"
                            label="Senha do Aprender 3"
                            placeholder="Senha do Aprender 3"
                            value={aprenderSenha}
                            onChange={(e) => {
                              setAprenderSenha(e.target.value);
                              setAprenderSaved(false);
                              setAprenderSuccessMsg(null);
                            }}
                            disabled={isLoading || isVerifying}
                          />
                          {aprenderSaved && aprenderSuccessMsg ? (
                            <div className="p-3 bg-pastel-green text-black border-2 border-black rounded-lg text-xs font-bold flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-ink-success stroke-[2.5] shrink-0" />
                              <span>{aprenderSuccessMsg}</span>
                            </div>
                          ) : null}
                          <div className="flex justify-end pt-1">
                            <Button
                              size="md"
                              variant={aprenderSaved ? 'destructive' : 'default'}
                              isLoading={isVerifying}
                              disabled={isVerifying || isLoading}
                              onClick={aprenderSaved ? handleDisconnectAprender3 : handleConnectAprender3}
                            >
                              {aprenderSaved ? (
                                <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                              )}
                              <span>
                                {isVerifying
                                  ? 'Validando conexão...'
                                  : aprenderSaved
                                  ? 'Desconectar do Aprender 3'
                                  : 'Conectar Aprender 3'}
                              </span>
                            </Button>
                          </div>
                        </>
                      )}

                      {p.id === 'teams' && (
                        <>
                          <p className="text-xs font-medium text-neutral-600 leading-relaxed">
                            Uma janela oficial do Teams será aberta para autenticar com seu e-mail
                            institucional (@aluno.unb.br ou @unb.br) e sincronizar suas turmas e avisos.
                          </p>
                          {teamsConnected && teamsSuccessMsg ? (
                            <div className="p-3 bg-pastel-green text-black border-2 border-black rounded-lg text-xs font-bold flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-ink-success stroke-[2.5] shrink-0" />
                              <span>{teamsSuccessMsg}</span>
                            </div>
                          ) : null}
                          <div className="flex justify-end pt-1">
                            <Button
                              variant={teamsConnected ? 'destructive' : 'default'}
                              size="md"
                              isLoading={isVerifying}
                              disabled={isLoading || isVerifying}
                              onClick={handleToggleTeams}
                            >
                              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>
                                {isVerifying
                                  ? 'Aguardando login no Teams...'
                                  : teamsConnected
                                  ? 'Conta Conectada (Clique para Desconectar)'
                                  : 'Fazer Login no Microsoft Teams'}
                              </span>
                            </Button>
                          </div>
                        </>
                      )}

                      {/* Erro do formulário ativo */}
                      {formError ? (
                        <div
                          role="alert"
                          className="p-3 bg-pastel-red border-2 border-black rounded-lg flex items-start gap-2.5"
                        >
                          <span className="p-1 bg-white border-2 border-black rounded-md shadow-[1px_1px_0px_0px_#000] shrink-0">
                            <AlertCircle className="w-3.5 h-3.5 text-ink-error stroke-[3]" />
                          </span>
                          <span className="text-xs font-bold text-ink-error leading-relaxed pt-0.5">
                            {formError}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Erro global do cofre */}
      {error ? (
        <div
          role="alert"
          className="mt-4 p-3 bg-pastel-red border-2 border-black rounded-lg flex items-start gap-2.5"
        >
          <span className="p-1 bg-white border-2 border-black rounded-md shadow-[1px_1px_0px_0px_#000] shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-ink-error stroke-[3]" />
          </span>
          <span className="text-xs font-bold text-ink-error leading-relaxed pt-0.5">{error}</span>
        </div>
      ) : null}
    </div>
  );
};
