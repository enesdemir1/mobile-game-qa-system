import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box
} from '@mui/material';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';

interface TestSuite {
  _id: string;
  title: string;
  description: string;
  module: string;
  version: string;
  platform: 'android' | 'ios' | 'web' | 'desktop' | 'both';
  status: 'draft' | 'active' | 'archived';
}

interface SuiteDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  suite: TestSuite | null;
}

const SuiteDialog: React.FC<SuiteDialogProps> = ({ open, onClose, onSave, suite }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    module: '',
    version: '',
    platform: 'web',
    status: 'draft'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (suite) {
      setFormData({
        title: suite.title,
        description: suite.description,
        module: suite.module,
        version: suite.version,
        platform: suite.platform,
        status: suite.status
      });
    } else {
      // Reset form for new suite
      setFormData({
        title: '',
        description: '',
        module: '',
        version: '',
        platform: 'web',
        status: 'draft'
      });
    }
  }, [suite, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.module || !formData.version) {
      toast.error('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    setLoading(true);

    // Prepare data for API
    const { status, ...suiteData } = formData;

    try {
      if (suite) {
        // Update existing suite
        await api.put(`/testsuites/${suite._id}`, suiteData);
        toast.success('Test suite başarıyla güncellendi.');
      } else {
        // Create new suite
        await api.post('/testsuites', suiteData);
        toast.success('Test suite başarıyla oluşturuldu.');
      }
      onSave();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{suite ? 'Test Suite Düzenle' : 'Yeni Test Suite Oluştur'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="title"
          label="Başlık"
          type="text"
          fullWidth
          value={formData.title}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="description"
          label="Açıklama"
          type="text"
          fullWidth
          multiline
          rows={3}
          value={formData.description}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="module"
          label="Modül"
          type="text"
          fullWidth
          value={formData.module}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="version"
          label="Versiyon"
          type="text"
          fullWidth
          value={formData.version}
          onChange={handleChange}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Platform</InputLabel>
          <Select
            name="platform"
            value={formData.platform}
            onChange={handleSelectChange}
            label="Platform"
          >
            <MenuItem value="android">Android</MenuItem>
            <MenuItem value="ios">iOS</MenuItem>
            <MenuItem value="web">Web</MenuItem>
            <MenuItem value="desktop">Desktop</MenuItem>
            <MenuItem value="both">Both (Mobile)</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel>Durum</InputLabel>
          <Select
            name="status"
            value={formData.status}
            onChange={handleSelectChange}
            label="Durum"
          >
            <MenuItem value="draft">Taslak (Draft)</MenuItem>
            <MenuItem value="active">Aktif (Active)</MenuItem>
            <MenuItem value="archived">Arşivlendi (Archived)</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose}>İptal</Button>
        <Box sx={{ position: 'relative' }}>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            Kaydet
          </Button>
          {loading && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default SuiteDialog; 