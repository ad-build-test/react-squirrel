import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { ApiKeyDTO } from '../types';

interface ApiKeysPageProps {
  apiKeys?: ApiKeyDTO[];
}

export function ApiKeysPage({ apiKeys = [] }: ApiKeysPageProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        API Keys
      </Typography>

      <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  App Name
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ width: 140 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Status
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ width: 140 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Read Access
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ width: 140 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Write Access
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apiKeys.map((key) => (
              <TableRow key={key.id} hover>
                <TableCell>
                  <Typography variant="body2">{key.appName}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={key.isActive ? 'Active' : 'Inactive'}
                    color={key.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={key.readAccess ? 'Yes' : 'No'}
                    color={key.readAccess ? 'primary' : 'default'}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={key.writeAccess ? 'Yes' : 'No'}
                    color={key.writeAccess ? 'primary' : 'default'}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {apiKeys.length === 0 && (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No API keys available
            </Typography>
          </Box>
        )}
      </TableContainer>
    </Box>
  );
}
