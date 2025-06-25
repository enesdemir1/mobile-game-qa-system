import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { TextField, Button, Box, Typography, CircularProgress, Container, Paper } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const schema = yup.object().shape({
  username: yup.string().min(3, 'Kullanıcı adı en az 3 karakter olmalı').required('Kullanıcı adı zorunlu'),
  email: yup.string().email('Geçerli bir email girin').required('Email zorunlu'),
  password: yup.string().min(6, 'Şifre en az 6 karakter olmalı').required('Şifre zorunlu'),
});

type RegisterForm = {
  username: string;
  email: string;
  password: string;
};

const Register: React.FC = () => {
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data.username, data.email, data.password);
      toast.success('Kayıt başarılı! Giriş yapıldı.');
      navigate('/');
    } catch (err: any) {
      console.error('Register error:', err);
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>Kayıt Ol</Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Kullanıcı Adı"
            fullWidth
            margin="normal"
            {...register('username')}
            error={!!errors.username}
            helperText={errors.username?.message}
            autoComplete="username"
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            autoComplete="email"
          />
          <TextField
            label="Şifre"
            type="password"
            fullWidth
            margin="normal"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
            autoComplete="new-password"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Kayıt Ol
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
