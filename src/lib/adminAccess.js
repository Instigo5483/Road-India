// Evaluation-only, client-visible passcode, not a production security boundary.
export const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'roadindia-admin'
