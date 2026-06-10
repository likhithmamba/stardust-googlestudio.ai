import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

import { registerServiceWorker } from './pwa/registration';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <GlobalErrorBoundary>
        <App />
    </GlobalErrorBoundary>,
)

registerServiceWorker();
