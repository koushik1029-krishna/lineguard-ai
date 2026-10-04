import { Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard.jsx';
import IncidentDetail from './components/IncidentDetail.jsx';
import IncidentForm from './components/IncidentForm.jsx';
import IncidentList from './components/IncidentList.jsx';
import Layout from './components/Layout.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="incidents" element={<IncidentList />} />
        <Route path="incidents/new" element={<IncidentForm />} />
        <Route path="incidents/:id" element={<IncidentDetail />} />
        <Route
          path="*"
          element={
            <div className="page">
              <h1>Page not found</h1>
              <p className="lede">That page is not part of LineGuard.</p>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
