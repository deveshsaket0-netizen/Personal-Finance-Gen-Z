import {createRoot} from 'react-dom/client'
import {Provider} from './state/store'
import App from './App'
import './styles/base.css'
createRoot(document.getElementById('root')!).render(<Provider><App/></Provider>)
