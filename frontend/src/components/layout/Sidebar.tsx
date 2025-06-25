import React from 'react';
import { NavLink } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Box, Divider } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ListAlt as ListAltIcon,
  Biotech as BiotechIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  BugReport as BugReportIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  BarChart as BarChartIcon,
  ExitToApp as ExitToAppIcon
} from '@mui/icons-material';

interface SidebarProps {
  drawerWidth: number;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Test Suites', icon: <BiotechIcon />, path: '/suites' },
  { text: 'Test Cases', icon: <PlaylistAddCheckIcon />, path: '/testcases' },
  { text: 'Reports', icon: <BarChartIcon />, path: '/reports' },
];

const NavLinkStyle = {
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  width: '100%',
};

const Sidebar: React.FC<SidebarProps> = ({ drawerWidth, isOpen, onClose }) => {
  const drawerContent = (
    <div>
      <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
        <BugReportIcon sx={{ mr: 1, fontSize: 30, color: 'primary.main' }} />
        <Typography variant="h6" component="div">
          QA System
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <NavLink key={item.text} to={item.path} style={NavLinkStyle}>
            {({ isActive }) => (
              <ListItem disablePadding>
                <ListItemButton selected={isActive}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            )}
          </NavLink>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={isOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }} // Better open performance on mobile.
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="persistent"
        open={isOpen}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, position: 'fixed' },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar; 