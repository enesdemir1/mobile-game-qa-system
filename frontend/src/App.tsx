import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import theme from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTestCase from './pages/CreateTestCase';
import TestCaseDetail from './pages/TestCaseDetail';
import EditTestCase from './pages/EditTestCase';
import TestSuites from './pages/TestSuites';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/layout/Layout';
import Reports from './pages/Reports';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Routes with Layout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/suites" element={<TestSuites />} />
                      <Route path="/create-testcase" element={<CreateTestCase />} />
                      <Route path="/testcase/:id" element={<ProtectedRoute><TestCaseDetail /></ProtectedRoute>} />
                      <Route path="/testcase/:id/edit" element={<ProtectedRoute><EditTestCase /></ProtectedRoute>} />
                      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                      {/* Add other layout-based routes here */}
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
