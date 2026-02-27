import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
} from '@mui/material';
import { useSnapshot } from '../contexts';

interface CreateSnapshotDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateSnapshotDialog({ open, onClose }: CreateSnapshotDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { startSnapshot } = useSnapshot();

  const handleCreate = () => {
    if (!title.trim()) {
      return;
    }

    // Fire and forget - starts the snapshot in the background
    startSnapshot(title.trim(), description.trim() || undefined);

    // Reset form and close dialog immediately
    setTitle('');
    setDescription('');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Snapshot</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This will capture the current values of all PVs in the system.
          </Typography>

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            size="small"
            required
            placeholder="e.g., Daily Backup - December 11"
          />

          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={3}
            placeholder="Describe the purpose of this snapshot..."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleCreate} variant="contained" disabled={!title.trim()}>
          Start Snapshot
        </Button>
      </DialogActions>
    </Dialog>
  );
}
