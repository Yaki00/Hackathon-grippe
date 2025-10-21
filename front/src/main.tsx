import { createRoot } from 'react-dom/client'
import './index.css'
import '@ant-design/v5-patch-for-react-19';
import { Dashboard } from './pages/Dashboard.tsx';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Layout } from './components/Layout.tsx';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/geographique" element={<Layout><div>Vue géographique</div></Layout>} />
      <Route path="/urgence" element={<Layout><div>Urgence Page</div></Layout>} />
    </Routes>
  </BrowserRouter>
)
