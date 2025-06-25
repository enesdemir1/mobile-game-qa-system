import React, { useState, useEffect } from 'react';
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
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
  Description as DescriptionIcon,
  List as ListIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../api/axios';

interface TestStep {
  id: string;
  order: number;
  action: string;
  expectedResult: string;
  actualResult?: string;
  status: 'pending' | 'passed' | 'failed' | 'blocked';
}

interface TestCaseForm {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active';
  testSuite?: string;
  platform: 'android' | 'ios' | 'both' | 'web' | 'desktop';
  buildVersion: string;
}

interface TestSuiteItem {
  _id: string;
  title: string;
}

const CreateTestCase: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [openStepDialog, setOpenStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<TestStep | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [suites, setSuites] = useState<TestSuiteItem[]>([]);

  const [formData, setFormData] = useState<TestCaseForm>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'draft',
    testSuite: '',
    platform: 'web',
    buildVersion: ''
  });

  const [stepForm, setStepForm] = useState({
    action: '',
    expectedResult: ''
  });

  const steps = [
    'Test Case Bilgileri',
    'Test Step\'leri Ekle',
    'Önizleme ve Kaydet'
  ];

  useEffect(() => {
    const fetchSuites = async () => {
      try {
        const response = await api.get('/testsuites');
        if (response.data && response.data.data) {
          setSuites(response.data.data);
        }
      } catch (error) {
        toast.error('Test suite listesi yüklenemedi.');
        console.error('Error fetching suites:', error);
      }
    };

    fetchSuites();
  }, []);

  const handleFormChange = (field: keyof TestCaseForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStepFormChange = (field: string, value: string) => {
    setStepForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTestStep = () => {
    if (!stepForm.action.trim() || !stepForm.expectedResult.trim()) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    const newStep: TestStep = {
      id: Date.now().toString(),
      order: testSteps.length + 1,
      action: stepForm.action,
      expectedResult: stepForm.expectedResult,
      status: 'pending'
    };

    setTestSteps(prev => [...prev, newStep]);
    setStepForm({ action: '', expectedResult: '' });
    setOpenStepDialog(false);
    toast.success('Test step eklendi');
  };

  const editTestStep = () => {
    if (!editingStep || !stepForm.action.trim() || !stepForm.expectedResult.trim()) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setTestSteps(prev => prev.map(step => 
      step.id === editingStep.id 
        ? { ...step, action: stepForm.action, expectedResult: stepForm.expectedResult }
        : step
    ));

    setEditingStep(null);
    setStepForm({ action: '', expectedResult: '' });
    setOpenStepDialog(false);
    toast.success('Test step güncellendi');
  };

  const deleteTestStep = (id: string) => {
    setTestSteps(prev => {
      const filtered = prev.filter(step => step.id !== id);
      // Reorder remaining steps
      return filtered.map((step, index) => ({
        ...step,
        order: index + 1
      }));
    });
    toast.success('Test step silindi');
  };

  const moveStep = (id: string, direction: 'up' | 'down') => {
    setTestSteps(prev => {
      const index = prev.findIndex(step => step.id === id);
      if (index === -1) return prev;

      const newSteps = [...prev];
      if (direction === 'up' && index > 0) {
        [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
      } else if (direction === 'down' && index < newSteps.length - 1) {
        [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      }

      // Update order numbers
      return newSteps.map((step, idx) => ({
        ...step,
        order: idx + 1
      }));
    });
  };

  const openEditDialog = (step: TestStep) => {
    setEditingStep(step);
    setStepForm({
      action: step.action,
      expectedResult: step.expectedResult
    });
    setOpenStepDialog(true);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!formData.title.trim() || !formData.description.trim()) {
        toast.error('Lütfen başlık ve açıklama alanlarını doldurun');
        return;
      }
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (testSteps.length === 0) {
      toast.error('En az bir test step eklemelisiniz');
      return;
    }

    setLoading(true);
    try {
      // First create test steps
      const testStepPromises = testSteps.map((step, index) => 
        api.post('/teststeps', {
          title: step.action,
          description: step.expectedResult,
          expectedResult: step.expectedResult,
          stepNumber: index + 1
        })
      );

      const testStepResponses = await Promise.all(testStepPromises);
      const stepRefs = testStepResponses.map(response => response.data.data._id);

      // Then create test case with step references
      const { status, testSuite, ...restOfFormData } = formData;
      const testCaseData = {
        ...restOfFormData,
        suiteId: testSuite || undefined,
        stepRefs: stepRefs
      };

      const response = await api.post('/testcases', testCaseData);
      toast.success('Test case başarıyla oluşturuldu!');
      navigate('/');
    } catch (error: any) {
      console.error('Error creating test case:', error);
      toast.error(error?.response?.data?.message || 'Test case oluşturulurken hata oluştu');
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
            <Typography variant="h6" gutterBottom>
              Test Case Temel Bilgileri
            </Typography>
            
            <TextField
              fullWidth
              label="Test Case Başlığı"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              margin="normal"
              required
              helperText="Test case'in kısa ve açıklayıcı başlığı"
            />

            <TextField
              fullWidth
              label="Açıklama"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              margin="normal"
              required
              multiline
              rows={4}
              helperText="Test case'in detaylı açıklaması"
            />

            <Box display="flex" gap={2} mt={2}>
              <FormControl fullWidth>
                <InputLabel>Öncelik</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => handleFormChange('priority', e.target.value)}
                  label="Öncelik"
                >
                  <MenuItem value="low">Düşük</MenuItem>
                  <MenuItem value="medium">Orta</MenuItem>
                  <MenuItem value="high">Yüksek</MenuItem>
                  <MenuItem value="critical">Kritik</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  label="Durum"
                >
                  <MenuItem value="draft">Taslak</MenuItem>
                  <MenuItem value="active">Aktif</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Platform</InputLabel>
                <Select
                  value={formData.platform}
                  onChange={(e) => handleFormChange('platform', e.target.value as any)}
                  label="Platform"
                >
                  <MenuItem value="android">Android</MenuItem>
                  <MenuItem value="ios">iOS</MenuItem>
                  <MenuItem value="web">Web</MenuItem>
                  <MenuItem value="desktop">Desktop</MenuItem>
                  <MenuItem value="both">Both (Mobile)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              label="Build Version"
              value={formData.buildVersion}
              onChange={(e) => handleFormChange('buildVersion', e.target.value)}
              margin="normal"
              required
              helperText="Testin yapıldığı uygulama versiyonu"
            />

            <Box display="flex" gap={2} mt={2}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Test Suite (Opsiyonel)</InputLabel>
                <Select
                  value={formData.testSuite}
                  onChange={(e) => handleFormChange('testSuite', e.target.value)}
                  label="Test Suite (Opsiyonel)"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {suites.map((suite) => (
                    <MenuItem key={suite._id} value={suite._id}>
                      {suite.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Test Step'leri ({testSteps.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenStepDialog(true)}
              >
                Test Step Ekle
              </Button>
            </Box>

            {testSteps.length === 0 ? (
              <Alert severity="info">
                Henüz test step eklenmemiş. Test case'in çalışması için en az bir test step eklemelisiniz.
              </Alert>
            ) : (
              <List>
                {testSteps.map((step, index) => (
                  <Card key={step.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Chip 
                              label={`Step ${step.order}`} 
                              size="small" 
                              color="primary" 
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={step.status} 
                              size="small" 
                              color={step.status === 'passed' ? 'success' : 'default'}
                            />
                          </Box>
                          
                          <Typography variant="subtitle2" gutterBottom>
                            <strong>Action:</strong> {step.action}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary">
                            <strong>Expected Result:</strong> {step.expectedResult}
                          </Typography>
                        </Box>

                        <Box display="flex" flexDirection="column">
                          <IconButton
                            size="small"
                            onClick={() => moveStep(step.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUpIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => moveStep(step.id, 'down')}
                            disabled={index === testSteps.length - 1}
                          >
                            <ArrowDownIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(step)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deleteTestStep(step.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
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
            <Typography variant="h6" gutterBottom>
              Test Case Önizleme
            </Typography>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {formData.title}
                </Typography>
                
                <Box display="flex" gap={1} mb={2}>
                  <Chip 
                    label={formData.priority} 
                    color={getPriorityColor(formData.priority) as any}
                  />
                  <Chip 
                    label={formData.status} 
                    color={formData.status === 'active' ? 'success' : 'default'}
                  />
                  {formData.testSuite && (
                    <Chip label={formData.testSuite} variant="outlined" />
                  )}
                </Box>

                <Typography variant="body1" paragraph>
                  {formData.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Test Steps ({testSteps.length})
                </Typography>

                {testSteps.map((step, index) => (
                  <Box key={step.id} mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="subtitle2" gutterBottom>
                      Step {step.order}: {step.action}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expected: {step.expectedResult}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Yeni Test Case Oluştur
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
        >
          Geri Dön
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Geri
          </Button>

          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                Test Case Oluştur
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                İleri
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Test Step Dialog */}
      <Dialog open={openStepDialog} onClose={() => setOpenStepDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStep ? 'Test Step Düzenle' : 'Yeni Test Step Ekle'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Action"
            value={stepForm.action}
            onChange={(e) => handleStepFormChange('action', e.target.value)}
            margin="normal"
            multiline
            rows={3}
            helperText="Test adımında yapılacak işlem"
          />
          <TextField
            fullWidth
            label="Expected Result"
            value={stepForm.expectedResult}
            onChange={(e) => handleStepFormChange('expectedResult', e.target.value)}
            margin="normal"
            multiline
            rows={3}
            helperText="Beklenen sonuç"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStepDialog(false)}>
            İptal
          </Button>
          <Button
            onClick={editingStep ? editTestStep : addTestStep}
            variant="contained"
            startIcon={editingStep ? <CheckIcon /> : <AddIcon />}
          >
            {editingStep ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreateTestCase; 