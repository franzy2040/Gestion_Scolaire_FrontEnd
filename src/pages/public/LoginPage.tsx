import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, Lock, Mail, Shield, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { toast } from 'sonner'
import { useLang } from '@/hooks/useLang'

/* ───────────────────────────────────────────────
   Lycée Bilingue de Baleng — LoginPage
   Connexion avec 2FA — Bilingue FR/EN
   ─────────────────────────────────────────────── */

const t = {
  fr: {
    backHome: "Retour à l'accueil",
    schoolName: 'Lycée Bilingue de Baleng',
    platformDesc: 'Plateforme de gestion scolaire',
    loginTitle: 'Connexion',
    verify2FA: 'Vérification 2FA',
    emailLabel: 'Email ou Matricule',
    emailPlaceholder: 'votre@email.com',
    passwordLabel: 'Mot de passe',
    passwordPlaceholder: '••••••••',
    totpLabel: 'Code 2FA',
    totpPlaceholder: '000000',
    totpHint: "Entrez le code de votre application d'authentification",
    loginBtn: 'Se connecter',
    verifyBtn: 'Vérifier',
    backToLogin: 'Retour à la connexion',
    loginSuccess: 'Connexion réussie',
    enter2FA: 'Veuillez entrer votre code 2FA',
    loginError: 'Erreur de connexion',
    copyright: '© {year} Lycée Bilingue de Baleng',
  },
  en: {
    backHome: 'Back to home',
    schoolName: 'Lycée Bilingue de Baleng',
    platformDesc: 'School Management Platform',
    loginTitle: 'Login',
    verify2FA: '2FA Verification',
    emailLabel: 'Email or ID',
    emailPlaceholder: 'your@email.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    totpLabel: '2FA Code',
    totpPlaceholder: '000000',
    totpHint: 'Enter the code from your authentication app',
    loginBtn: 'Sign in',
    verifyBtn: 'Verify',
    backToLogin: 'Back to login',
    loginSuccess: 'Login successful',
    enter2FA: 'Please enter your 2FA code',
    loginError: 'Login error',
    copyright: '© {year} Lycée Bilingue de Baleng',
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const { lang } = useLang()
  const txt = t[lang]

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (requires2FA) {
        const response = await authService.loginWith2FA({
          email,
          password,
          totp_code: totpCode,
        })
        login(response.user, response.access_token, response.refresh_token)
        toast.success(txt.loginSuccess)
        const from = location.state?.from || '/dashboard'
        navigate(from, { replace: true })
      } else {
        const response = await authService.login({ email, password })
        if (response.requires_2fa) {
          setRequires2FA(true)
          toast.info(txt.enter2FA)
          setIsLoading(false)
          return
        }
        login(response.user, response.access_token, response.refresh_token)
        toast.success(txt.loginSuccess)
        const from = location.state?.from || '/dashboard'
        navigate(from, { replace: true })
      }
    } catch (err: any) {
      toast.error(err.message || txt.loginError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">

        {/* ─── RETOUR À L'ACCUEIL ─── */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {txt.backHome}
          </Link>
        </div>

        {/* Logo cliquable */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-900 mb-4 hover:bg-blue-800 transition-colors cursor-pointer">
              <GraduationCap className="h-8 w-8 text-yellow-500" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{txt.schoolName}</h1>
          <p className="text-gray-500">{txt.platformDesc}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-center mb-6">
              {requires2FA ? txt.verify2FA : txt.loginTitle}
            </h2>

            <form onSubmit={onSubmit} className="space-y-4">
              {!requires2FA && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{txt.emailLabel}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={txt.emailPlaceholder}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{txt.passwordLabel}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={txt.passwordPlaceholder}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {requires2FA && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{txt.totpLabel}</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={txt.totpPlaceholder}
                      maxLength={6}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {txt.totpHint}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : requires2FA ? (
                  txt.verifyBtn
                ) : (
                  txt.loginBtn
                )}
              </button>

              {requires2FA && (
                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false)
                    setTotpCode('')
                  }}
                  className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  disabled={isLoading}
                >
                  {txt.backToLogin}
                </button>
              )}
            </form>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          {txt.copyright.replace('{year}', String(new Date().getFullYear()))}
        </p>
      </div>
    </div>
  )
}