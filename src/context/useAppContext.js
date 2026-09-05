import { useContext } from 'react'
import { AuthContext, AdminAuthContext, LanguageContext, ReportsContext, ToastContext } from './contexts'

function useRequiredContext(context, name) {
  const value = useContext(context)
  if (!value) throw new Error(name + ' must be used inside its provider')
  return value
}

export function useAuth() { return useRequiredContext(AuthContext, 'useAuth') }
export function useAdminAuth() { return useRequiredContext(AdminAuthContext, 'useAdminAuth') }
export function useLanguage() { return useRequiredContext(LanguageContext, 'useLanguage') }
export function useReports() { return useRequiredContext(ReportsContext, 'useReports') }
export function useToast() { return useRequiredContext(ToastContext, 'useToast') }
