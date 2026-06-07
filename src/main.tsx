import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <GlobalErrorBoundary>
        <App />
    </GlobalErrorBoundary>,
)

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('ServiceWorker registered:', reg))
            .catch(err => console.error('ServiceWorker registration failed:', err));
    });
}
