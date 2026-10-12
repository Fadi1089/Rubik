import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'

const root = createRoot(document.getElementById('root')!)

// Dev-only tool for regenerating the guide pictures; stripped from production builds.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('capture-guide-images')) {
  void import('./dev/CaptureGuideImages').then(({ CaptureGuideImages }) =>
    root.render(<CaptureGuideImages />),
  )
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
