import { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { Search, Edit, Delete } from '@mui/icons-material';
import { Snapshot } from '../types';
import { snapshotService } from '../services';

interface SnapshotListPageProps {
  snapshots: Snapshot[];
  onSnapshotClick: (snapshot: Snapshot) => void;
  onUpdateSnapshot?: (snapshot: Snapshot) => void;
  onDeleteSnapshot?: (snapshotId: string) => Promise<void>;
  isAdmin: boolean;
}

export function SnapshotListPage({
  snapshots,
  onSnapshotClick,
  onUpdateSnapshot,
  onDeleteSnapshot,
  isAdmin,
}: SnapshotListPageProps) {
  const [searchText, setSearchText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<Snapshot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [snapshotBeingEdited, setSnapshotBeingEdited] = useState<Snapshot | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openEditDialog = (snapshot: Snapshot) => {
    setSnapshotBeingEdited(snapshot);
    setEditedTitle(snapshot.title);
    setEditedDescription(snapshot.description);
    setEditDialogOpen(true);
  };

  const hasChanges =
    editedTitle !== snapshotBeingEdited?.title ||
    editedDescription !== snapshotBeingEdited?.description;

  const handleUpdateConfirm = async () => {
    if (!snapshotBeingEdited) return;

    if (!hasChanges) {
      setEditDialogOpen(false);
      return;
    }
    const prev = snapshotBeingEdited;

    onUpdateSnapshot?.({
      ...prev,
      title: editedTitle,
      description: editedDescription,
    });

    setEditDialogOpen(false);
    setSnapshotBeingEdited(null);
    setIsSaving(true);

    try {
      const response = await snapshotService.updateSnapshot(prev.uuid, {
        title: editedTitle,
        description: editedDescription,
      });

      // reconcile with server response
      onUpdateSnapshot?.({
        ...prev,
        title: response.title,
        description: response.description ?? '',
        pvCount: response.pvCount,
      });
    } catch (err) {
      console.error('Failed to update snapshot', err);
      // rollback
      onUpdateSnapshot?.(prev);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, snapshot: Snapshot) => {
    e.stopPropagation(); // Prevent row click
    setSnapshotToDelete(snapshot);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!snapshotToDelete || !onDeleteSnapshot) return;

    setIsDeleting(true);
    try {
      await onDeleteSnapshot(snapshotToDelete.uuid);
      setDeleteDialogOpen(false);
      setSnapshotToDelete(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete snapshot:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSnapshotToDelete(null);
  };

  const filteredSnapshots = useMemo(() => {
    if (!searchText) return snapshots;

    const lowerFilter = searchText.toLowerCase();
    return snapshots.filter(
      (snapshot) =>
        snapshot.title.toLowerCase().includes(lowerFilter) ||
        snapshot.description.toLowerCase().includes(lowerFilter)
    );
  }, [snapshots, searchText]);

  const formatTimestamp = (date: Date) =>
    date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
          Snapshots
        </Typography>
        <TextField
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search title..."
          size="small"
          sx={{ maxWidth: 400 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Title
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Description
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Created
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight="bold">
                  PV Count
                </Typography>
              </TableCell>
              {isAdmin && (
                <TableCell align="center" sx={{ width: 60 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Actions
                  </Typography>
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSnapshots.map((snapshot) => (
              <TableRow
                key={snapshot.uuid}
                hover
                sx={{ cursor: 'pointer' }}
                onDoubleClick={() => onSnapshotClick(snapshot)}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    {snapshot.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {snapshot.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{formatTimestamp(snapshot.creation_time)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{snapshot.pvCount ?? snapshot.pvs.length}</Typography>
                </TableCell>
                {isAdmin && (
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(snapshot);
                        }}
                        title="Edit snapshot"
                        sx={{
                          color: '#0066cc',
                          '&:hover': {
                            color: '#005bb5',
                          },
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => handleDeleteClick(e, snapshot)}
                        title="Delete snapshot"
                        disabled={!onDeleteSnapshot}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredSnapshots.length === 0 && (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {searchText ? 'No snapshots match your search' : 'No snapshots available'}
            </Typography>
          </Box>
        )}
      </TableContainer>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Snapshot</DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 0 }}>
          <Box sx={{ px: 3, pt: 1, borderBottom: '1px solid #eee' }}>
            <TextField
              fullWidth
              label="Title"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Description"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateConfirm}
            disabled={isSaving || !hasChanges}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Snapshot</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the snapshot &apos;{snapshotToDelete?.title}&apos;? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting || !onDeleteSnapshot}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
