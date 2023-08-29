import EditIcon from '@mui/icons-material/Edit';
import {
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import useALContext from 'components/hooks/useALContext';
import useMySnackbar from 'components/hooks/useMySnackbar';
import { CustomUser } from 'components/hooks/useMyUser';
import { ChipList } from 'components/visual/ChipList';
import Classification from 'components/visual/Classification';
import ConfirmationDialog from 'components/visual/ConfirmationDialog';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useFavorites, { Favorite } from './hooks/useFavorites';

const useStyles = makeStyles(theme => ({
  label: {
    display: 'flex',
    alignItems: 'center',
    columnGap: theme.spacing(1)
  },
  editIconButton: {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.26)' : 'rgba(0, 0, 0, 0.26)',
    padding: 'inherit',
    height: '18.33px',
    width: '18.33px',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'
    }
  },
  preview: {
    margin: 0,
    padding: theme.spacing(0.75, 1),
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  }
}));

type Confirmation = { open: boolean; favorite: Favorite; isPublic: boolean };

interface AlertsFiltersFavoritesProps {
  initValue?: string;
  onSaved: (favorite: { name: string; query: string }) => void;
  onSelected: (favorite: Favorite) => void;
  onDeleted: (favorite: Favorite) => void;
}

const AlertsFiltersFavorites: React.FC<AlertsFiltersFavoritesProps> = ({
  initValue,
  onSaved,
  onSelected,
  onDeleted
}) => {
  const theme = useTheme();
  const classes = useStyles();
  const { t } = useTranslation('favorites');
  const {
    userFavorites,
    globalFavorites,
    onAddUserFavorite,
    onDeleteUserFavorite,
    onAddGlobalFavorite,
    onDeleteGlobalFavorite
  } = useFavorites();
  const { showErrorMessage, showSuccessMessage } = useMySnackbar();
  const { c12nDef } = useALContext();
  const { user: currentUser } = useAppUser<CustomUser>();
  const [formValid, setFormValid] = useState<boolean>(false);
  const [classification, setClassification] = useState<string>(c12nDef.UNRESTRICTED);
  const [queryValue, setQueryValue] = useState<{ valid: boolean; value: string }>({ valid: true, value: initValue });
  const [nameValue, setNameValue] = useState<{ valid: boolean; value: string }>({ valid: true, value: '' });
  const [publicSwitch, setPublicSwitch] = useState<boolean>(false);
  const [addConfirmation, setAddConfirmation] = useState<boolean>(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<Confirmation>({
    open: false,
    favorite: null,
    isPublic: false
  });
  const [loading, setLoading] = useState<boolean>(false);

  const isExistingFavorite = useMemo<boolean>(
    () =>
      publicSwitch
        ? globalFavorites.some(f => f.name === nameValue.value)
        : userFavorites.some(f => f.name === nameValue.value),
    [globalFavorites, nameValue, publicSwitch, userFavorites]
  );

  const validateForm = (
    _queryValue: { valid: boolean; value: string },
    _nameValue: { valid: boolean; value: string }
  ) => {
    setFormValid(!!_queryValue.value && !!_nameValue.value);
  };

  const handleEnter = useCallback(() => {
    setLoading(true);
  }, []);

  const handleExit = useCallback(() => {
    setLoading(false);
    setQueryValue({ valid: true, value: initValue });
    setNameValue({ valid: true, value: '' });
  }, [initValue]);

  const _onDelete = (favorite: Favorite, isPublic: boolean) => {
    if (isPublic) {
      onDeleteGlobalFavorite(
        favorite,
        () => onDeleted(favorite),
        handleEnter,
        () => setLoading(false)
      );
    } else {
      onDeleteUserFavorite(
        favorite,
        () => onDeleted(favorite),
        handleEnter,
        () => setLoading(false)
      );
    }
  };

  const _onSave = () => {
    if (queryValue.value && nameValue.value) {
      const favorite: Favorite = {
        query: queryValue.value,
        name: nameValue.value,
        classification: publicSwitch && c12nDef.enforce ? classification : c12nDef.UNRESTRICTED,
        created_by: currentUser.username
      };

      if (publicSwitch) {
        onAddGlobalFavorite(
          favorite,
          () => {
            showSuccessMessage(t('added.global'));
            onSaved(favorite);
          },
          handleEnter,
          handleExit
        );
      } else {
        onAddUserFavorite(
          favorite,
          () => {
            showSuccessMessage(t('added.personal'));
            onSaved(favorite);
          },
          handleEnter,
          handleExit
        );
      }
    } else {
      showErrorMessage(t('form.field.required'));
    }
  };

  const handleDeleteClick = (favorite: Favorite, isPublic: boolean) => {
    setDeleteConfirmation({ open: true, favorite, isPublic });
  };

  const handleDeleteAccept = () => {
    const { favorite, isPublic } = deleteConfirmation;
    _onDelete(favorite, isPublic);
    setDeleteConfirmation({ open: false, favorite: null, isPublic: false });
  };

  const handleDeleteClose = () => {
    setDeleteConfirmation({ open: false, favorite: null, isPublic: false });
  };

  const handleAddClick = () => {
    setAddConfirmation(true);
  };

  const handleAddAccept = () => {
    _onSave();
    setAddConfirmation(false);
  };

  const handleAddClose = () => {
    setAddConfirmation(false);
  };

  const _onSelect = (favorite: Favorite) => {
    onSelected(favorite);
  };

  const onQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    const _queryValue = { valid: !!value, value };
    setQueryValue(_queryValue);
    validateForm(_queryValue, nameValue);
  };

  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    const _nameValue = { valid: !!value, value };
    setNameValue({ valid: !!value, value });
    validateForm(queryValue, _nameValue);
  };

  const onSwitchChange = (isPublic: boolean) => {
    setPublicSwitch(isPublic);
  };

  const handleEditClick = useCallback(
    (favorite: Favorite, isPublic: boolean) => (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.stopPropagation();
      setQueryValue({ valid: !!favorite.query, value: favorite.query });
      setNameValue({ valid: !!favorite.name, value: favorite.name });
      setClassification(favorite.classification);
      setPublicSwitch(isPublic);
      validateForm(
        { valid: !!favorite.query, value: favorite.query },
        { valid: !!favorite.name, value: favorite.name }
      );
    },
    []
  );

  return (
    <div>
      <div style={{ paddingBottom: theme.spacing(2) }}>
        <Typography variant="h4">{t('addfavorites')}</Typography>
      </div>
      <div style={{ textAlign: 'right' }}>
        <Button
          onClick={() => onSwitchChange(!publicSwitch)}
          size="small"
          color="primary"
          disableElevation
          disableRipple
        >
          <div>{t('private')}</div>
          <div style={{ flex: 1 }}>
            <Switch
              checked={publicSwitch}
              onChange={event => onSwitchChange(event.target.checked)}
              color="primary"
              disabled={loading}
            />
          </div>
          <div>{t('public')}</div>
        </Button>
      </div>
      {publicSwitch && c12nDef.enforce ? (
        <Classification type="picker" c12n={classification} setClassification={setClassification} disabled={loading} />
      ) : (
        <div style={{ padding: theme.spacing(2.25) }} />
      )}
      <div style={{ marginTop: theme.spacing(1), marginBottom: theme.spacing(2) }}>
        <div>
          <Typography variant="subtitle2">{t('query')}</Typography>
          <TextField
            error={!queryValue.valid}
            variant="outlined"
            value={queryValue.value}
            onChange={onQueryChange}
            onBlur={() => setQueryValue({ ...queryValue, valid: !!queryValue.value })}
            fullWidth
            disabled={loading}
          />
        </div>
        <div style={{ marginTop: theme.spacing(2) }}>
          <Typography variant="subtitle2">{t('name')}</Typography>
          <TextField
            error={!nameValue.valid}
            variant="outlined"
            value={nameValue.value}
            onChange={onNameChange}
            onBlur={() => setNameValue({ ...nameValue, valid: !!nameValue.value })}
            fullWidth
            disabled={loading}
          />
        </div>
      </div>

      <div style={{ paddingTop: theme.spacing(2), paddingBottom: theme.spacing(4), textAlign: 'right' }}>
        <Tooltip title={isExistingFavorite ? t('update.tooltip') : t('add.tooltip')}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddClick}
            disabled={!formValid || loading}
            startIcon={loading && <CircularProgress size={24} />}
          >
            {isExistingFavorite ? t('update.button') : t('add.button')}
          </Button>
        </Tooltip>
      </div>

      {/* Your personnal favorites  */}
      <Typography variant="h6">{t('yourfavorites')}</Typography>
      <Divider />
      <div style={{ marginTop: theme.spacing(1), marginBottom: theme.spacing(4) }}>
        <ChipList
          items={userFavorites.map(f => ({
            size: 'medium',
            variant: 'outlined',
            label: (
              <div className={classes.label}>
                <div>{f.name}</div>
                <IconButton className={classes.editIconButton} onClick={handleEditClick(f, false)}>
                  <EditIcon style={{ color: theme.palette.background.paper, fontSize: 'small' }} />
                </IconButton>
              </div>
            ),
            tooltip: f.query,
            onClick: () => _onSelect(f),
            onDelete: () => handleDeleteClick(f, false)
          }))}
        />
      </div>

      {/* The global favorites */}
      <Typography variant="h6">{t('globalfavorites')}</Typography>
      <Divider />
      <div style={{ marginTop: theme.spacing(1) }}>
        <ChipList
          items={globalFavorites.map(f => ({
            size: 'medium',
            variant: 'outlined',
            label: (
              <div className={classes.label}>
                <div>{f.name}</div>
                <IconButton className={classes.editIconButton} onClick={handleEditClick(f, true)}>
                  <EditIcon style={{ color: theme.palette.background.paper, fontSize: 'small' }} />
                </IconButton>
              </div>
            ),
            tooltip: f.query,
            onClick: () => _onSelect(f),
            onDelete: () => handleDeleteClick(f, true)
          }))}
        />
      </div>

      <ConfirmationDialog
        open={addConfirmation}
        handleClose={handleAddClose}
        handleAccept={handleAddAccept}
        title={isExistingFavorite ? t('confirmation.header.update') : t('confirmation.header.add')}
        cancelText={t('cancel')}
        acceptText={isExistingFavorite ? t('confirmation.ok.update') : t('confirmation.ok.add')}
        text={
          <Grid container flexDirection="column" spacing={theme.spacing(2)}>
            <Grid item component="span">
              {isExistingFavorite ? t('confirmation.content.update') : t('confirmation.content.add')}
              <b>{nameValue ? nameValue.value : null}</b>
              {isExistingFavorite ? t('confirmation.content.update2') : t('confirmation.content.add2')}
              {publicSwitch ? t('confirmation.content.public') : t('confirmation.content.private')}
            </Grid>

            {isExistingFavorite ? (
              <>
                <Grid item>
                  <Typography variant="subtitle2">{t('confirmation.from')}</Typography>
                  <Paper component="pre" variant="outlined" className={classes.preview}>
                    {publicSwitch
                      ? globalFavorites.find(f => f.name === nameValue.value)?.query
                      : userFavorites.find(f => f.name === nameValue.value)?.query}
                  </Paper>
                </Grid>

                <Grid item>
                  <Typography variant="subtitle2">{t('confirmation.to')}</Typography>
                  <Paper component="pre" variant="outlined" className={classes.preview}>
                    {queryValue.value}
                  </Paper>
                </Grid>
              </>
            ) : (
              <Grid item>
                <Typography variant="subtitle2">{t('confirmation.query')}</Typography>
                <Paper component="pre" variant="outlined" className={classes.preview}>
                  {queryValue.value}
                </Paper>
              </Grid>
            )}

            <Grid item component="span" children={t('confirmation.confirm')} />
          </Grid>
        }
      />

      <ConfirmationDialog
        open={deleteConfirmation.open}
        handleClose={handleDeleteClose}
        handleAccept={handleDeleteAccept}
        title={t('confirmation.header.delete')}
        cancelText={t('cancel')}
        acceptText={t('confirmation.ok.delete')}
        text={
          <Grid container flexDirection="column" spacing={theme.spacing(2)}>
            <Grid item component="span">
              {t('confirmation.content.delete')}
              <b>{deleteConfirmation.favorite ? deleteConfirmation.favorite.name : null}</b>
              {t('confirmation.content.delete2')}
              {deleteConfirmation
                ? deleteConfirmation.isPublic
                  ? t('confirmation.content.public')
                  : t('confirmation.content.private')
                : null}
            </Grid>

            <Grid item>
              <Typography variant="subtitle2">{t('confirmation.query')}</Typography>
              <Paper component="pre" variant="outlined" className={classes.preview}>
                {deleteConfirmation.favorite ? deleteConfirmation.favorite.query : null}
              </Paper>
            </Grid>

            <Grid item component="span" children={t('confirmation.confirm')} />
          </Grid>
        }
      />
    </div>
  );
};

export default AlertsFiltersFavorites;
