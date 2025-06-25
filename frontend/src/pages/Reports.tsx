import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'react-hot-toast';
import api from '../api/axios';

const COLORS = {
  passed: '#4caf50',
  failed: '#f44336',
  in_progress: '#ff9800',
  draft: '#9e9e9e',
  completed: '#2196f3',
  active: '#00bcd4',
  critical: '#f44336',
  high: '#ff9800',
  medium: '#2196f3',
  low: '#4caf50',
  default: '#9e9e9e'
};


const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/reports');
        setReportData(response.data.data);
      } catch (err) {
        toast.error('Rapor verileri yüklenemedi.');
        setError('Rapor verileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []);
  
  const StatCard: React.FC<{ title: string; value: number | string }> = ({ title, value }) => (
    <Card>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="h3" component="p" gutterBottom>
          {value}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!reportData) return <Alert severity="info">Rapor verisi bulunamadı.</Alert>;

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom sx={{ my: 3 }}>
        Test Raporları
      </Typography>
      
      {/* Top Stats */}
      <Box display="flex" gap={3} mb={4} sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
        <Box flex={1}><StatCard title="Toplam Test Suite" value={reportData.totalSuites} /></Box>
        <Box flex={1}><StatCard title="Toplam Test Case" value={reportData.totalCases} /></Box>
        <Box flex={1}><StatCard title="Toplam Test Step" value={reportData.totalSteps} /></Box>
      </Box>

      {/* Charts */}
      <Box display="flex" gap={4} sx={{ flexDirection: { xs: 'column', lg: 'row' } }}>
        <Box flex={1}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Test Case Durum Dağılımı</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={reportData.casesByStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {reportData.casesByStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry._id as keyof typeof COLORS] || COLORS.default} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
        <Box flex={1}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Test Case Öncelik Dağılımı</Typography>
            <ResponsiveContainer width="100%" height={300}>
               <BarChart data={reportData.casesByPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d">
                   {reportData.casesByPriority.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry._id as keyof typeof COLORS] || COLORS.default} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default Reports; 