import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AdminLayout } from './admin/AdminLayout'
import { AutomationEditorPage } from './admin/AutomationEditorPage'
import { AutomationsPage } from './admin/AutomationsPage'
import { ContactDetailPage } from './admin/ContactDetailPage'
import { ContactsPage } from './admin/ContactsPage'
import { DashboardPage } from './admin/DashboardPage'
import { EmailTestPage } from './admin/EmailTestPage'
import { ListsPage } from './admin/ListsPage'
import { SettingsPage } from './admin/SettingsPage'
import { TagsPage } from './admin/TagsPage'
import { TrackingPixels } from './components/TrackingPixels'
import {
  CheckoutCancelPage,
  CheckoutPage,
  CheckoutSuccessPage,
} from './pages/CheckoutPage'
import { HomePage } from './pages/HomePage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import { TermsPage } from './pages/TermsPage'
import './App.css'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <TrackingPixels />
      <Routes>
        <Route
          path="/"
          element={
            <div className="page">
              <HomePage />
            </div>
          }
        />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="contacts/:id" element={<ContactDetailPage />} />
          <Route path="lists" element={<ListsPage />} />
          <Route path="tags" element={<TagsPage />} />
          <Route path="automations" element={<AutomationsPage />} />
          <Route path="automations/:id" element={<AutomationEditorPage />} />
          <Route path="email-test" element={<EmailTestPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route
          path="/privacy-policy"
          element={
            <div className="page">
              <PrivacyPolicyPage />
            </div>
          }
        />
        <Route
          path="/terms-and-conditions"
          element={
            <div className="page">
              <TermsPage />
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
