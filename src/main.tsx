import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize default question sets on app start
import { initializeDefaultQuestionSets } from './services/questionSetService';
initializeDefaultQuestionSets().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)