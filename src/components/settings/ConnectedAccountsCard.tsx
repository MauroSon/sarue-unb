import { KeyRound } from "lucide-react";
import { PlatformAccountsAccordion } from "@/components/onboarding/PlatformAccountsAccordion";
import { SettingsSection } from "@/components/settings/SettingsSection";

/**
 * Seção "Contas conectadas" de Configurações: o accordion de gavetas do
 * cofre dentro do card padrão da página (variante "panel" — linhas
 * segmentadas, sem sombra própria, para o card não aninhar adesivos,
 * com inputs em linha no desktop e coluna em telas menores).
 * Toda a lógica de conexão, estados, bloqueios e efeitos vive no
 * PlatformAccountsAccordion compartilhado com o onboarding.
 */
export const ConnectedAccountsCard: React.FC = () => {
  return (
    <SettingsSection icon={KeyRound} label="Contas conectadas">
      <PlatformAccountsAccordion
        variant="panel"
        animated={false}
        initialOpenPlatform={null}
        allowAllClosed
      />
    </SettingsSection>
  );
};
