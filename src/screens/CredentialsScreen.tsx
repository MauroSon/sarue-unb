import React, { useState } from 'react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardDescription,
} from '@/components/ui';
import { useCredentials } from '../hooks/useCredentials';
import {
  Lock,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import type { PlatformType } from '@/core';

export interface CredentialsScreenProps {
  onSuccess: () => void;
  onBack: () => void;
  onExplore?: () => void;
}

export const CredentialsScreen: React.FC<CredentialsScreenProps> = ({
  onSuccess,
  onBack,
  onExplore,
}) => {
  const { saveSigaa, saveAprender3, saveTeams, isLoading, error } = useCredentials();

  // Plataforma ativa no formulário
  const [activeTab, setActiveTab] = useState<PlatformType>('sigaa');

  // Campos SIGAA
  const [sigaaMatricula, setSigaaMatricula] = useState('');
  const [sigaaSenha, setSigaaSenha] = useState('');
  const [sigaaSaved, setSigaaSaved] = useState(false);
  const [sigaaSuccessMsg, setSigaaSuccessMsg] = useState<string | null>(null);

  // Campos Aprender 3
  const [aprenderCpf, setAprenderCpf] = useState('');
  const [aprenderSenha, setAprenderSenha] = useState('');
  const [aprenderSaved, setAprenderSaved] = useState(false);
  const [aprenderSuccessMsg, setAprenderSuccessMsg] = useState<string | null>(null);

  // Teams
  const [teamsConnected, setTeamsConnected] = useState(false);
  const [teamsEmail, setTeamsEmail] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSaveCurrentPlatform = async () => {
    setFormError(null);

    if (activeTab === 'sigaa') {
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
        } else {
          setSigaaSaved(false);
          setSigaaSuccessMsg(null);
          setFormError(res.error || 'Falha ao autenticar no SIGAA. Verifique matrícula e senha.');
        }
      } finally {
        setIsVerifying(false);
      }
    } else if (activeTab === 'aprender3') {
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
        } else {
          setAprenderSaved(false);
          setAprenderSuccessMsg(null);
          setFormError(res.error || 'Falha ao autenticar no Aprender 3. Verifique CPF e senha.');
        }
      } finally {
        setIsVerifying(false);
      }
    } else if (activeTab === 'teams') {
      const email = teamsEmail.trim() || 'aluno@aluno.unb.br';
      const ok = await saveTeams({ isConnected: true, email });
      if (ok) setTeamsConnected(true);
    }
  };

  const handleToggleTeams = async () => {
    setFormError(null);
    if (teamsConnected) {
      setTeamsConnected(false);
    } else {
      const email = teamsEmail.trim() || 'aluno@aluno.unb.br';
      const ok = await saveTeams({ isConnected: true, email });
      if (ok) setTeamsConnected(true);
    }
  };

  const handleFinish = async () => {
    setFormError(null);

    // Salva o que estiver preenchido no formulário da aba ativa antes de concluir
    if (activeTab === 'sigaa' && (sigaaMatricula || sigaaSenha) && !sigaaSaved) {
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
    } else if (activeTab === 'aprender3' && (aprenderCpf || aprenderSenha) && !aprenderSaved) {
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
    } else if (activeTab === 'teams' && teamsConnected) {
      await saveTeams({ isConnected: true, email: teamsEmail.trim() || 'aluno@aluno.unb.br' });
    }

    onSuccess();
  };

  const platforms = [
    { id: 'sigaa' as PlatformType, name: 'SIGAA', isSaved: sigaaSaved, hint: 'Matrícula e Senha' },
    { id: 'aprender3' as PlatformType, name: 'Aprender 3', isSaved: aprenderSaved, hint: 'CPF e Senha' },
    { id: 'teams' as PlatformType, name: 'Teams', isSaved: teamsConnected, hint: 'Login Manual' },
  ];

  return (
    <div className="min-h-screen bg-canvas bg-grid flex flex-col justify-center items-center p-6 md:p-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Topo com Voltar e Explorar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-xs inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-black transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2"
          >
            <ChevronLeft className="w-4 h-4 stroke-[3]" />
            Voltar para o Início
          </button>

          {onExplore ? (
            <button
              type="button"
              onClick={onExplore}
              className="cursor-pointer rounded-xs text-xs font-bold text-neo-blue hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2"
            >
              Explorar sem Conectar &rarr;
            </button>
          ) : null}
        </div>

        {/* Card Principal */}
        <Card className="bg-white rounded-lg p-6 md:p-8">
          <CardHeader className="p-0 mb-6">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 bg-unb-blue text-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000]">
                <Lock className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h1 className="text-2xl font-extrabold text-black tracking-tight">
                Acesso às Plataformas
              </h1>
            </div>
            <CardDescription className="text-sm font-medium text-neutral-600 leading-relaxed">
              Cada plataforma da UnB possui seu próprio formato de login. Configure as plataformas que deseja sincronizar.
            </CardDescription>
          </CardHeader>

          {/* Abas das plataformas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
            {platforms.map((p) => {
              const isSelected = activeTab === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setActiveTab(p.id);
                    setFormError(null);
                  }}
                  className={`cursor-pointer p-3 border-2 border-black rounded-xl text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2 transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out translate-x-0 translate-y-0 shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    isSelected
                      ? 'bg-neo-blue text-white font-bold'
                      : 'bg-white text-neutral-800 hover:bg-neutral-50 font-semibold'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{p.name}</span>
                    {p.isSaved ? (
                      <CheckCircle2
                        className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'text-white' : 'text-ink-success'}`}
                      />
                    ) : null}
                  </div>
                  <span
                    className={`text-[11px] font-medium block truncate ${
                      isSelected ? 'text-white' : 'text-neutral-500'
                    }`}
                  >
                    {p.hint}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Formulário específico por plataforma */}
          <div className="space-y-4 min-h-[170px]">
            {activeTab === 'sigaa' && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-neo-blue">
                  Credenciais do SIGAA (Matrícula e Senha)
                </h2>
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
                  <div className="p-3 bg-neo-green/20 text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-ink-success stroke-[2.5] shrink-0" />
                    <span>{sigaaSuccessMsg}</span>
                  </div>
                ) : null}
              </div>
            )}

            {activeTab === 'aprender3' && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-neo-blue">
                  Credenciais do Aprender 3 (CPF e Senha)
                </h2>
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
                  <div className="p-3 bg-neo-green/20 text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-ink-success stroke-[2.5] shrink-0" />
                    <span>{aprenderSuccessMsg}</span>
                  </div>
                ) : null}
              </div>
            )}

            {activeTab === 'teams' && (
              <div className="p-4 bg-canvas border-2 border-black rounded-lg space-y-3 shadow-[4px_4px_0px_0px_#000]">
                <h2 className="text-xs font-bold text-neo-blue">
                  Microsoft Teams Institucional (Login Manual)
                </h2>
                <p className="text-xs font-medium text-neutral-600 leading-relaxed">
                  O Teams utiliza autenticação corporativa Microsoft 365 e requer validação interativa.
                </p>
                <Input
                  label="E-mail Institucional UnB (opcional)"
                  placeholder="Ex: aluno@aluno.unb.br"
                  value={teamsEmail}
                  onChange={(e) => setTeamsEmail(e.target.value)}
                  disabled={isLoading || isVerifying}
                />
                <div className="pt-1">
                  <Button
                    type="button"
                    variant={teamsConnected ? 'destructive' : 'primary'}
                    size="md"
                    onClick={handleToggleTeams}
                  >
                    <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {teamsConnected
                        ? 'Conta Conectada (Clique para Desconectar)'
                        : 'Conectar Conta Microsoft Teams'}
                    </span>
                  </Button>
                </div>
              </div>
            )}

            {/* Botão para salvar a plataforma ativa */}
            {activeTab !== 'teams' ? (
              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  isLoading={isVerifying}
                  disabled={isVerifying || isLoading}
                  onClick={handleSaveCurrentPlatform}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>
                    {isVerifying
                      ? 'Validando conexão...'
                      : `Salvar e Conectar ${platforms.find((p) => p.id === activeTab)?.name}`}
                  </span>
                </Button>
              </div>
            ) : null}
          </div>

          {/* Erros */}
          {formError || error ? (
            <div
              role="alert"
              className="mt-4 p-3 bg-neo-danger text-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_#000] text-xs font-bold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 stroke-[3] shrink-0" />
              <span>{formError || error}</span>
            </div>
          ) : null}

          {/* Botões de Conclusão */}
          <div className="pt-6 border-t-2 border-black/10 mt-6 space-y-3">
            <Button
              type="button"
              variant="default"
              size="lg"
              isLoading={isLoading || isVerifying}
              disabled={isVerifying || isLoading}
              onClick={handleFinish}
              className="w-full text-base"
            >
              <span>Acessar Painel e Sincronizar</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </Button>

            {onExplore ? (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onExplore}
                className="w-full text-xs"
              >
                <span>Explorar sem Conectar Contas Agora</span>
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
};
