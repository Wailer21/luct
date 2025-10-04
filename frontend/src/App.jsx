import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './utils/auth'
import AppRoutes from './routes/AppRoutes'
import Navigation from './components/layout/Navigation'
import './styles/App.css'

export default function App() {
  return (
   <> <AuthProvider>
      <BrowserRouter>
        <div className="min-vh-100 bg-light d-flex flex-column">
          <Navigation />
          <main className="flex-grow-1">
            <AppRoutes />
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
    <section>
      <footer>&copy;2025 Limkokwing University. All Rights Reserved</footer>
    </section>
    
    </>
  )
}
