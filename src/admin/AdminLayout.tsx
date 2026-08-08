import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { adminPassword, isAdminAuthed, setAdminAuthed } from '../lib/adminAuth'
import './admin.css'

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== adminPassword) {
      setLoginError('Incorrect password.')
      return
    }
    setAdminAuthed(true)
    setLoginError('')
    onSuccess()
  }

  return (
    <div className="fk-login">
      <div className="fk-login__card">
        <p className="fk-login__brand">Boss Lab CRM</p>
        <h1>Admin</h1>
        <p className="fk-muted">Enter the password to continue.</p>
        <form className="fk-login__form" onSubmit={handleLogin}>
          <label className="fk-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {loginError ? <p className="fk-error">{loginError}</p> : null}
          <button type="submit" className="fk-btn fk-btn--primary">
            Unlock dashboard
          </button>
        </form>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const [authed, setAuthed] = useState(isAdminAuthed)
  const navigate = useNavigate()
  const location = useLocation()
  const isBuilder = /^\/admin\/automations\/[^/]+$/.test(location.pathname)

  useEffect(() => {
    setAuthed(isAdminAuthed())
  }, [])

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />
  }

  const handleLogout = () => {
    setAdminAuthed(false)
    setAuthed(false)
    navigate('/admin')
  }

  return (
    <div className={`fk-app${isBuilder ? ' is-builder' : ''}`}>
      {!isBuilder ? (
        <header className="fk-topnav">
          <div className="fk-topnav__brand">Boss Lab</div>
          <nav className="fk-topnav__links">
            <NavLink to="/admin" end className={navClass}>
              Dashboard
            </NavLink>
            <NavLink to="/admin/contacts" className={navClass}>
              Contacts
            </NavLink>
            <NavLink to="/admin/lists" className={navClass}>
              Lists
            </NavLink>
            <NavLink to="/admin/tags" className={navClass}>
              Tags
            </NavLink>
            <NavLink to="/admin/automations" className={navClass}>
              Automations
            </NavLink>
            <NavLink to="/admin/email-test" className={navClass}>
              Email Test
            </NavLink>
            <NavLink to="/admin/settings" className={navClass}>
              Settings
            </NavLink>
          </nav>
          <button type="button" className="fk-btn fk-btn--ghost" onClick={handleLogout}>
            Lock
          </button>
        </header>
      ) : null}
      <main className={isBuilder ? 'fk-main fk-main--builder' : 'fk-main'}>
        <Outlet />
      </main>
    </div>
  )
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'fk-navlink is-active' : 'fk-navlink'
}

export function AdminPageShell({
  title,
  count,
  actions,
  children,
}: {
  title: string
  count?: number
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="fk-page">
      <div className="fk-page__header">
        <h1>
          {title}
          {typeof count === 'number' ? (
            <span className="fk-page__count"> ({count} Results)</span>
          ) : null}
        </h1>
        {actions ? <div className="fk-page__actions">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}
