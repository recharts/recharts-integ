import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ComparisonPage from './ComparisonPage.tsx'; // Import the new page

const Main = () => {
  const [currentPage, setCurrentPage] = useState('app'); // 'app' or 'comparison'

  return (
    <>
      <nav style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <button
          onClick={() => setCurrentPage('app')}
          style={{ marginRight: '10px', padding: '5px 10px', cursor: 'pointer', fontWeight: currentPage === 'app' ? 'bold' : 'normal' }}
        >
          Test Results Dashboard
        </button>
        <button
          onClick={() => setCurrentPage('comparison')}
          style={{ padding: '5px 10px', cursor: 'pointer', fontWeight: currentPage === 'comparison' ? 'bold' : 'normal' }}
        >
          Results Comparison
        </button>
      </nav>
      {currentPage === 'app' ? <App /> : <ComparisonPage />}
    </>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Main />
  </StrictMode>,
)
