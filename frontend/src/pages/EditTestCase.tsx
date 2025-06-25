import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  List,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Check as CheckIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import api from '../api/axios';

interface TestStep {
  _id: string; // From backend
  id?: string; // For frontend temporary id
  order: number;
  title: string;
  expectedResult: string;
  status: 'pending' | 'passed' | 'failed' | 'blocked';
}

interface TestCaseForm {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'failed';
  testSuite?: string;
}

const EditTestCase: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [openStepDialog, setOpenStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<TestStep | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState<TestCaseForm>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'draft'
  });

  const [stepForm, setStepForm] = useState({
    title: '',
    expectedResult: ''
  });

  useEffect(() => {
    fetchTestCase();
  }, [id]);

  const fetchTestCase = async () => {
    try {
      const response = await api.get(`/testcases/${id}`);
      const testCaseData = response.data.data;
      setFormData({
        title: testCaseData.title,
        description: testCaseData.description,
        priority: testCaseData.priority,
        status: testCaseData.status,
        testSuite: testCaseData.testSuite?._id || ''
      });
      const fetchedSteps = testCaseData.stepRefs.map((ref: any, index: number) => ({
        ...ref.stepId,
        order: index + 1
      }));
      setTestSteps(fetchedSteps);
    } catch (error) {
      toast.error('Test case verileri yüklenirken bir hata oluştu.');
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  };

  const steps = [
    'Test Case Bilgileri',
    'Test Step\'leri Düzenle',
    'Önizleme ve Kaydet'
  ];

  const handleFormChange = (field: keyof TestCaseForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStepFormChange = (field: string, value: string) => {
    setStepForm(prev => ({ ...prev, [field]: value }));
  };

  const addOrEditTestStep = () => {
    if (!stepForm.title.trim() || !stepForm.expectedResult.trim()) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    if (editingStep) {
      // Edit existing step
      setTestSteps(prev => prev.map(step =>
        step._id === editingStep._id || step.id === editingStep.id
          ? { ...step, title: stepForm.title, expectedResult: stepForm.expectedResult }
          : step
      ));
      toast.success('Test adımı güncellendi.');
    } else {
      // Add new step
      const newStep: TestStep = {
        id: `temp-${Date.now()}`,
        _id: `temp-${Date.now()}`,
        order: testSteps.length + 1,
        title: stepForm.title,
        expectedResult: stepForm.expectedResult,
        status: 'pending'
      };
      setTestSteps(prev => [...prev, newStep]);
      toast.success('Test adımı eklendi.');
    }

    setOpenStepDialog(false);
    setEditingStep(null);
    setStepForm({ title: '', expectedResult: '' });
  };

  const deleteTestStep = (stepToDelete: TestStep) => {
    setTestSteps(prev => {
      const filtered = prev.filter(step => step._id !== stepToDelete._id);
      return filtered.map((step, index) => ({ ...step, order: index + 1 }));
    });
    toast.success('Test adımı silindi.');
  };

  const openEditDialog = (step: TestStep) => {
    setEditingStep(step);
    setStepForm({
      title: step.title,
      expectedResult: step.expectedResult
    });
    setOpenStepDialog(true);
  };
  
  const openNewDialog = () => {
    setEditingStep(null);
    setStepForm({ title: '', expectedResult: '' });
    setOpenStepDialog(true);
  }

  const handleNext = () => {
    if (activeStep === 0 && (!formData.title.trim() || !formData.description.trim())) {
      toast.error('Lütfen başlık ve açıklama alanlarını doldurun');
      return;
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (testSteps.length === 0) {
      toast.error('En az bir test adımı olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      const stepCreationPromises = testSteps
        .filter(step => step.id?.startsWith('temp-'))
        .map(step => api.post('/teststeps', {
          title: step.title,
          description: step.expectedResult,
          expectedResult: step.expectedResult,
          stepNumber: step.order
        }));

      const stepUpdatePromises = testSteps
        .filter(step => !step.id?.startsWith('temp-'))
        .map(step => api.put(`/teststeps/${step._id}`, {
          title: step.title,
          description: step.expectedResult,
          expectedResult: step.expectedResult,
          stepNumber: step.order
        }));
      
      const createdSteps = await Promise.all(stepCreationPromises);
      const updatedSteps = await Promise.all(stepUpdatePromises);

      const newStepIds = createdSteps.map(res => res.data.data._id);
      const existingStepIds = updatedSteps.map(res => res.data.data._id);
      
      const stepRefs = [...newStepIds, ...existingStepIds].map(stepId => ({ stepId }));

      const testCaseData = { ...formData, stepRefs };
      await api.put(`/testcases/${id}`, testCaseData);

      toast.success('Test case başarıyla güncellendi!');
      navigate(`/testcase/${id}`);
    } catch (error: any) {
      console.error('Error updating test case:', error);
      toast.error(error?.response?.data?.message || 'Test case güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
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
  
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Test Case Temel Bilgileri</Typography>
            <TextField fullWidth label="Test Case Başlığı" value={formData.title} onChange={(e) => handleFormChange('title', e.target.value)} margin="normal" required />
            <TextField fullWidth label="Açıklama" value={formData.description} onChange={(e) => handleFormChange('description', e.target.value)} margin="normal" required multiline rows={4} />
            <Box display="flex" gap={2} mt={2}>
              <FormControl fullWidth>
                <InputLabel>Öncelik</InputLabel>
                <Select value={formData.priority} onChange={(e) => handleFormChange('priority', e.target.value)} label="Öncelik">
                  <MenuItem value="low">Düşük</MenuItem>
                  <MenuItem value="medium">Orta</MenuItem>
                  <MenuItem value="high">Yüksek</MenuItem>
                  <MenuItem value="critical">Kritik</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select value={formData.status} onChange={(e) => handleFormChange('status', e.target.value)} label="Durum">
                  <MenuItem value="draft">Taslak</MenuItem>
                  <MenuItem value="active">Aktif</MenuItem>
                  <MenuItem value="in_progress">Devam Ediyor</MenuItem>
                  <MenuItem value="completed">Tamamlandı</MenuItem>
                  <MenuItem value="failed">Başarısız</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Test Adımları ({testSteps.length})</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openNewDialog}>Test Adımı Ekle</Button>
            </Box>
            {testSteps.length === 0 ? <Alert severity="info">Henüz test adımı eklenmemiş.</Alert> : (
              <List>
                {testSteps.map((step, index) => (
                  <Card key={step._id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <Chip label={`Adım ${step.order}`} size="small" color="primary" sx={{ mr: 1 }} />
                          <Typography variant="subtitle2" gutterBottom mt={1}><strong>Aksiyon:</strong> {step.title}</Typography>
                          <Typography variant="body2" color="text.secondary"><strong>Beklenen Sonuç:</strong> {step.expectedResult}</Typography>
                        </Box>
                        <Box>
                          <IconButton size="small" onClick={() => openEditDialog(step)}><EditIcon /></IconButton>
                          <IconButton size="small" color="error" onClick={() => deleteTestStep(step)}><DeleteIcon /></IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </List>
            )}
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Önizleme</Typography>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>{formData.title}</Typography>
                <Box display="flex" gap={1} mb={2}>
                  <Chip label={formData.priority} color={getPriorityColor(formData.priority) as any} />
                  <Chip label={formData.status} />
                </Box>
                <Typography variant="body1" paragraph>{formData.description}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>Test Adımları ({testSteps.length})</Typography>
                {testSteps.map(step => (
                  <Box key={step._id} mb={1} p={1} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="subtitle2">Adım {step.order}: {step.title}</Typography>
                    <Typography variant="body2" color="text.secondary">Beklenen: {step.expectedResult}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        );
      default: return null;
    }
  };

  if (initialLoading) {
    return <Container><Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box></Container>;
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">Test Case Düzenle</Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Geri Dön</Button>
      </Box>
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
        {renderStepContent(activeStep)}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>Geri</Button>
          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={<SaveIcon />}>
              {loading ? <CircularProgress color="inherit" size={24} /> : 'Değişiklikleri Kaydet'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>İleri</Button>
          )}
        </Box>
      </Paper>
      <Dialog open={openStepDialog} onClose={() => setOpenStepDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingStep ? 'Test Adımını Düzenle' : 'Yeni Test Adımı Ekle'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Aksiyon" type="text" fullWidth multiline rows={3} value={stepForm.title} onChange={(e) => handleStepFormChange('title', e.target.value)} />
          <TextField margin="dense" label="Beklenen Sonuç" type="text" fullWidth multiline rows={3} value={stepForm.expectedResult} onChange={(e) => handleStepFormChange('expectedResult', e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStepDialog(false)}>İptal</Button>
          <Button onClick={addOrEditTestStep} variant="contained">{editingStep ? 'Güncelle' : 'Ekle'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EditTestCase; 