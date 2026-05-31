import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <GlobalErrorBoundary>
        <App />
    </GlobalErrorBoundary>,
)
