import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.scss'
import App from './App.tsx'
import { ReferenceDataProvider } from './context/ReferenceDataContext'
import { WarbandProvider } from './context/WarbandContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReferenceDataProvider>
      <WarbandProvider>
        <App />
      </WarbandProvider>
    </ReferenceDataProvider>
  </StrictMode>,
)
