import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import api from '../api/axios';
import SuiteDialog from '../components/suites/SuiteDialog';

interface TestSuite {
  _id: string;
  title: string;
  description: string;
  module: string;
  version: string;
  platform: 'android' | 'ios' | 'web' | 'desktop' | 'both';
  status: 'draft' | 'active' | 'archived';
  testCaseCount: number;
}

const TestSuites: React.FC = () => {
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null);

  useEffect(() => {
    fetchSuites();
  }, []);

  const fetchSuites = async () => {
    setLoading(true);
    try {
      const response = await api.get('/testsuites');
      // The actual data is in response.data.data according to controller
      setSuites(response.data.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching test suites:', err);
      setError(err?.response?.data?.message || 'Test suite\'ları yüklerken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (suiteId: string) => {
    if (window.confirm('Bu test suite\'i silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await api.delete(`/testsuites/${suiteId}`);
        toast.success('Test suite başarıyla silindi.');
        fetchSuites(); // Refresh the list
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Test suite silinirken bir hata oluştu.');
      }
    }
  };

  const handleOpenDialog = (suite: TestSuite | null = null) => {
    setEditingSuite(suite);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSuite(null);
  };
  
  const handleSave = () => {
    handleCloseDialog();
    fetchSuites(); // Refresh list on save
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'android': return 'success';
      case 'ios': return 'info';
      case 'web': return 'warning';
      case 'desktop': return 'primary';
      default: return 'default';
    }
  };

  if (loading) {
    return <Container><Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box></Container>;
  }

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Test Suite Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Yeni Test Suite Oluştur
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Başlık</TableCell>
                <TableCell>Modül</TableCell>
                <TableCell>Versiyon</TableCell>
                <TableCell>Platform</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Test Case Sayısı</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography p={4} color="text.secondary">
                      Henüz test suite bulunmuyor.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                suites.map((suite) => (
                  <TableRow key={suite._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{suite.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                        {suite.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{suite.module}</TableCell>
                    <TableCell>{suite.version}</TableCell>
                    <TableCell>
                      <Chip label={suite.platform} color={getPlatformColor(suite.platform) as any} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={suite.status} size="small" />
                    </TableCell>
                    <TableCell>{suite.testCaseCount || 0}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Düzenle">
                        <IconButton size="small" color="info" onClick={() => handleOpenDialog(suite)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton size="small" color="error" onClick={() => handleDelete(suite._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <SuiteDialog 
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        suite={editingSuite}
      />
    </Container>
  );
};

export default TestSuites; 