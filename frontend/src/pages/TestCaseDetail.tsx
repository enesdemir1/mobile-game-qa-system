import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  RadioButtonUnchecked as PendingIcon,
  Block as BlockIcon,
  CloudUpload
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import api from '../api/axios';

interface TestStep {
  _id: string;
  title: string;
  description: string;
  expectedResult: string;
  status: 'pending' | 'passed' | 'failed' | 'blocked';
  attachments?: { path: string; originalName: string }[];
}

interface TestCase {
  _id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'failed';
  testSuite: { _id: string; title: string };
  createdBy: { _id: string; username: string };
  stepRefs: { stepId: TestStep }[];
  createdAt: string;
  updatedAt: string;
}

const TestCaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTestCase();
  }, [id]);

  const fetchTestCase = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/testcases/${id}`);
      setTestCase(response.data.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching test case:', err);
      setError(err?.response?.data?.message || 'Test case yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const deleteTestCase = async () => {
    if (window.confirm('Bu test case\'i silmek istediğinizden emin misiniz?')) {
      try {
        await api.delete(`/testcases/${id}`);
        toast.success('Test case başarıyla silindi');
        navigate('/');
      } catch (err: any) {
        console.error('Error deleting test case:', err);
        toast.error(err?.response?.data?.message || 'Test case silinirken hata oluştu');
      }
    }
  };

  const startTestExecution = async () => {
    try {
      const response = await api.post(`/testcases/${id}/start`);
      setTestCase(response.data.data);
      toast.success('Test koşumu başlatıldı!');
    } catch (err: any) {
      console.error('Error starting test execution:', err);
      toast.error(err?.response?.data?.message || 'Test koşumu başlatılamadı.');
    }
  };

  const completeTestExecution = async () => {
    try {
      const response = await api.post(`/testcases/${id}/complete`);
      setTestCase(response.data.data);
      toast.success('Test koşumu tamamlandı!');
    } catch (err: any) {
      console.error('Error completing test execution:', err);
      toast.error(err?.response?.data?.message || 'Test koşumu tamamlanamadı.');
    }
  };

  const updateStepStatus = async (stepId: string, status: 'passed' | 'failed' | 'blocked') => {
    if (!testCase) return;

    try {
      const response = await api.patch(`/testcases/${id}/steps/${stepId}`, { status });
      // Update the state to reflect the change
      const updatedTestCase = response.data.data;
      setTestCase(updatedTestCase);
      toast.success(`Test adımı "${status}" olarak işaretlendi.`);
    } catch (err: any) {
      console.error('Error updating step status:', err);
      toast.error(err?.response?.data?.message || 'Test adımı durumu güncellenemedi.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, stepId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('attachment', file);

    try {
      const response = await api.post(`/teststeps/${stepId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      // Refresh the test case data to show the new attachment
      fetchTestCase();
      toast.success('Dosya başarıyla yüklendi!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Dosya yüklenirken bir hata oluştu.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'failed': return 'error';
      case 'active': return 'info';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircleIcon color="success" />;
      case 'failed': return <CancelIcon color="error" />;
      case 'blocked': return <BlockIcon color="action" />;
      default: return <PendingIcon color="disabled" />;
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
      </Container>
    );
  }

  if (!testCase) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 3 }}>Test case bulunamadı.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" my={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Geri
        </Button>
        <Box display="flex" gap={2}>
          {testCase.status !== 'in_progress' && (
            <Button
              variant="outlined"
              startIcon={<PlayArrowIcon />}
              color="success"
              onClick={startTestExecution}
              disabled={testCase.status === 'completed'}
            >
              Testi Başlat
            </Button>
          )}
          {testCase.status === 'in_progress' && (
             <Button
                variant="outlined"
                startIcon={<StopIcon />}
                color="warning"
                onClick={completeTestExecution}
              >
                Testi Bitir
              </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/testcase/${id}/edit`)}
          >
            Düzenle
          </Button>
          <Button
            variant="contained"
            startIcon={<DeleteIcon />}
            color="error"
            onClick={deleteTestCase}
          >
            Sil
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {testCase.title}
        </Typography>

        <Box display="flex" gap={1} mb={2}>
          <Chip
            label={testCase.priority}
            color={getPriorityColor(testCase.priority) as any}
            size="small"
          />
          <Chip
            label={testCase.status}
            color={getStatusColor(testCase.status) as any}
            size="small"
          />
          {testCase.testSuite && (
            <Chip label={testCase.testSuite.title} variant="outlined" size="small" />
          )}
        </Box>

        <Typography variant="body1" paragraph color="text.secondary">
          {testCase.description}
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Test Steps */}
        <Typography variant="h6" gutterBottom>
          Test Adımları
        </Typography>
        <List>
          {testCase.stepRefs.map(({ stepId: step }, index) => (
            <React.Fragment key={step._id}>
              <ListItem 
                secondaryAction={
                  testCase.status === 'in_progress' && (
                    <Box>
                      <IconButton edge="end" aria-label="pass" onClick={() => updateStepStatus(step._id, 'passed')}>
                        <CheckCircleIcon color="success" />
                      </IconButton>
                      <IconButton edge="end" aria-label="fail" onClick={() => updateStepStatus(step._id, 'failed')}>
                        <CancelIcon color="error" />
                      </IconButton>
                      <IconButton edge="end" aria-label="block" onClick={() => updateStepStatus(step._id, 'blocked')}>
                        <BlockIcon color="action" />
                      </IconButton>
                    </Box>
                  )
                }
              >
                <ListItemIcon>
                  <Tooltip title={step.status}>
                    {getStepStatusIcon(step.status)}
                  </Tooltip>
                </ListItemIcon>
                <ListItemText
                  primary={`Adım ${index + 1}: ${step.title}`}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {step.description}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2" color="text.secondary">
                        Beklenen Sonuç: {step.expectedResult}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              <ListItem>
                <Box sx={{ pl: 7, width: '100%' }}>
                  <Typography variant="subtitle2" gutterBottom>Ekler:</Typography>
                  {step.attachments && step.attachments.length > 0 ? (
                    <List dense disablePadding>
                      {step.attachments.map((att, attIndex) => (
                        <ListItem key={attIndex} sx={{ pl: 0 }}>
                          <a href={`${process.env.REACT_APP_API_URL}/${att.path}`} target="_blank" rel="noopener noreferrer">
                            <ListItemText primary={att.originalName} primaryTypographyProps={{ variant: 'body2', color: 'primary' }} />
                          </a>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Ek bulunmuyor.</Typography>
                  )}
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    startIcon={<CloudUpload />}
                    sx={{ mt: 1 }}
                    disabled={testCase.status !== 'in_progress'}
                  >
                    Dosya Yükle
                    <input
                      type="file"
                      hidden
                      onChange={(e) => handleFileUpload(e, step._id)}
                    />
                  </Button>
                </Box>
              </ListItem>
              {index < testCase.stepRefs.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>

        <Divider sx={{ my: 3 }} />

        {/* Metadata */}
        <Box display="flex" justifyContent="space-between" color="text.secondary">
          <Typography variant="caption">
            Oluşturan: {testCase.createdBy.username}
          </Typography>
          <Typography variant="caption">
            Oluşturulma Tarihi: {new Date(testCase.createdAt).toLocaleString('tr-TR')}
          </Typography>
          <Typography variant="caption">
            Son Güncelleme: {new Date(testCase.updatedAt).toLocaleString('tr-TR')}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestCaseDetail; 