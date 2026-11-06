; Hooks customizados para o instalador NSIS do Saruê UnB (salvo com UTF-8 BOM)
; Garante o encerramento seguro e liberação de handles antes de verificar ou sobrescrever arquivos.

!macro CloseSarueApp
  DetailPrint "Fechando Saruê UnB graciosamente..."
  nsExec::Exec 'taskkill /IM "Saruê UnB.exe"'
  Pop $0
  Sleep 1000
  DetailPrint "Garantindo encerramento de processos bloqueantes..."
  nsExec::Exec 'taskkill /F /IM "Saruê UnB.exe"'
  Pop $0
  Sleep 500
!macroend

!macro NSIS_HOOK_PREINSTALL
  !insertmacro CloseSarueApp
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  !insertmacro CloseSarueApp
!macroend
