import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import React from 'react';

// import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Collapse, Divider, Grid, IconButton, Link, Tooltip, Typography, useTheme } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import useExternalLookup from 'components/hooks/useExternalLookup';
import { useTranslation } from 'react-i18next';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import clsx from 'clsx';
import useALContext from 'components/hooks/useALContext';
import { ExternalEnrichmentResult } from 'components/providers/ExternalLookupProvider';
import { DetailedItem } from 'components/routes/alerts/hooks/useAlerts';
import { ChipList } from 'components/visual/ChipList';
import Classification from 'components/visual/Classification';
import CustomChip, { CustomChipProps } from 'components/visual/CustomChip';
import { getMaxClassification } from 'helpers/classificationParser';
import { toTitleCase, verdictToColor } from 'helpers/utils';

const TARGET_RESULT_COUNT = 10;

const useStyles = makeStyles(theme => ({
  link: {
    width: '100%',
    flex: 1,
    overflow: 'hidden',
    textDecoration: 'none'
  },
  content: {
    flex: 1,
    fontWeight: 400,
    color: theme.palette.primary.main
  },
  error: {
    flex: 1,
    fontWeight: 400,
    color: theme.palette.text.primary,
    fontSize: 'small'
  },
  launch: {
    color: theme.palette.primary.main,
    transition: 'color 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
    '&:hover': {
      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark
    }
  },
  section: {
    marginBottom: theme.spacing(2),
    '& > hr': {
      marginBottom: theme.spacing(1)
    }
  },
  sectionContent: {},
  collapseTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    '&:hover, &:focus': {
      color: theme.palette.text.secondary
    }
  }
}));

type AutoHideChipListProps = {
  items: DetailedItem[];
};

type AutoHideChipListState = {
  showExtra: boolean;
  fullChipList: CustomChipProps[];
};

type ExternalLookupProps = {
  category: string;
  type: string;
  value: string;
  iconStyle?: null | Object;
};

const WrappedAutoHideChipList: React.FC<AutoHideChipListProps> = ({ items }) => {
  const { t } = useTranslation();
  const [state, setState] = React.useState<AutoHideChipListState | null>(null);
  const [shownChips, setShownChips] = React.useState<CustomChipProps[]>([]);

  React.useEffect(() => {
    const fullChipList = items.map(item => ({
      category: 'tag',
      label: item[0].toString(),
      variant: 'outlined' as 'outlined',
      // type: 'rounded' as 'rounded',
      tooltip: item[1].toString()
    }));
    const showExtra = items.length <= TARGET_RESULT_COUNT;

    setState({ showExtra, fullChipList });
  }, [items]);

  React.useEffect(() => {
    if (state !== null) {
      if (state.showExtra) {
        setShownChips(state.fullChipList);
      } else {
        setShownChips(state.fullChipList.slice(0, TARGET_RESULT_COUNT));
      }
    }
  }, [state]);

  return (
    <>
      <ChipList items={shownChips} />
      {state && !state.showExtra && (
        <Tooltip title={t('more')}>
          <IconButton size="small" onClick={() => setState({ ...state, showExtra: true })} style={{ padding: 0 }}>
            <MoreHorizOutlinedIcon />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

const AutoHideChipList = React.memo(WrappedAutoHideChipList);

type ResultGroupProps = {
  group: string;
  names: string[];
  ndMap: Object;
  valueMap: Object;
};

const WrappedResultGroup: React.FC<ResultGroupProps> = ({ group, names, ndMap, valueMap }) => {
  const theme = useTheme();
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  return group && names ? (
    <>
      <Typography
        variant="h6"
        onClick={() => {
          setOpen(!open);
        }}
        className={classes.collapseTitle}
      >
        <span>{toTitleCase(group)}</span>
        {open ? <ExpandLess /> : <ExpandMore />}
      </Typography>
      <Divider />

      <Collapse in={open} timeout="auto">
        <Grid container spacing={1} style={{ marginTop: theme.spacing(1) }}>
          {names.map((keyName, k) => {
            return (
              <React.Fragment key={k}>
                <Grid item xs={6} sm={6}>
                  <Tooltip title={ndMap[keyName]}>
                    <div className={classes.sectionContent}>{keyName}</div>
                  </Tooltip>
                </Grid>
                <Grid item xs={6} sm={6}>
                  <div className={classes.sectionContent}>
                    <AutoHideChipList items={valueMap[keyName]} />
                  </div>
                </Grid>
              </React.Fragment>
            );
          })}
        </Grid>
      </Collapse>
    </>
  ) : null;
};

const ResultGroup = React.memo(WrappedResultGroup);

type EnrichmentResultProps = {
  enrichmentResult: ExternalEnrichmentResult;
};

const WrappedEnrichmentResult: React.FC<EnrichmentResultProps> = ({ enrichmentResult }) => {
  const classes = useStyles();
  const [open, setOpen] = React.useState(true);

  let verdict = 'info';
  if (enrichmentResult.malicious === false) {
    verdict = 'safe';
  } else if (enrichmentResult.malicious === true) {
    verdict = 'malicious';
  }

  // create lookup tables
  // Note: we only take the order of when a source or name appears first. If they appear again later,
  //       then it will be added to the higher order.
  // [{group: str, name: str, name_description: str, value: str, value_description: str}]
  //   vLookup -> {group: {name: [[value, desc], ...]}}
  //   nLookup -> {group: [name, ...]}
  //   ndLookup -> {name: desc, ...}
  let vLookup = {};
  let nLookup = {};
  let ndLookup = {};
  let gOrder = [];
  enrichmentResult.enrichment.forEach(enrichmentItem => {
    //  values map
    if (!(enrichmentItem.group in vLookup)) {
      vLookup[enrichmentItem.group] = {};
    }
    if (!(enrichmentItem.name in vLookup[enrichmentItem.group])) {
      vLookup[enrichmentItem.group][enrichmentItem.name] = [];
    }
    vLookup[enrichmentItem.group][enrichmentItem.name].push([enrichmentItem.value, enrichmentItem.value_description]);

    // name maps
    if (!(enrichmentItem.group in nLookup)) {
      nLookup[enrichmentItem.group] = [];
    }
    if (!nLookup[enrichmentItem.group].includes(enrichmentItem.name)) {
      nLookup[enrichmentItem.group].push(enrichmentItem.name);
      ndLookup[enrichmentItem.name] = enrichmentItem.name_description;
    }

    // group order
    if (!gOrder.includes(enrichmentItem.group)) {
      gOrder.push(enrichmentItem.group);
    }
  });

  return enrichmentResult ? (
    <>
      <div>
        <Typography
          onClick={() => {
            setOpen(!open);
          }}
          className={classes.collapseTitle}
        >
          <span>
            Verdict:{' '}
            <CustomChip type="rounded" size="tiny" variant="filled" color={verdictToColor(verdict)} label={verdict} />
          </span>
          {open ? <ExpandLess /> : <ExpandMore />}
        </Typography>
        <Link className={clsx(classes.link)} href={enrichmentResult.link} target="_blank" rel="noopener noreferrer">
          <Typography className={clsx(classes.content, classes.launch)}>
            {enrichmentResult.count} results
            <LaunchOutlinedIcon sx={{ verticalAlign: 'middle', height: '16px' }} />
          </Typography>
        </Link>
        <Typography>{enrichmentResult.description}</Typography>
      </div>
      <div className={classes.sectionContent}></div>

      <Collapse in={open} timeout="auto">
        {!!gOrder &&
          gOrder.map((grpName, j) => {
            return (
              <ResultGroup
                key={j}
                group={grpName}
                names={nLookup[grpName]}
                ndMap={ndLookup}
                valueMap={vLookup[grpName]}
              ></ResultGroup>
            );
          })}
      </Collapse>
    </>
  ) : null;
};

const EnrichmentResult = React.memo(WrappedEnrichmentResult);

const WrappedExternalLinks: React.FC<ExternalLookupProps> = ({ category, type, value, iconStyle }) => {
  const theme = useTheme();
  const classes = useStyles();
  const [openedDialog, setOpenedDialog] = React.useState(false);
  const [scroll, setScroll] = React.useState<DialogProps['scroll']>('paper');
  const { c12nDef } = useALContext();

  const { enrichmentState, isActionable, getKey } = useExternalLookup();
  const actionable = isActionable(category, type, value);
  const externalLookupResults = enrichmentState[getKey(type, value)];
  const titleId = openedDialog ? 'external-result-dialog-title' : undefined;
  const descriptionId = openedDialog ? 'external-result-dialog-description' : undefined;

  // prevents click through propagation on dialog popup
  const handleDialogClick = e => {
    e.stopPropagation();
  };

  const handleClickOpen = () => {
    setOpenedDialog(true);
    setScroll('paper');
  };

  const handleClose = () => {
    setOpenedDialog(false);
  };

  const descriptionElementRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    if (openedDialog) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [openedDialog]);

  // determine max classification of all return results
  let classification = 'TLP:C';
  if (!!externalLookupResults) {
    Object.values(externalLookupResults).forEach(enrichmentResults => {
      enrichmentResults.items.forEach(enrichmentResult => {
        classification = getMaxClassification(classification, enrichmentResult.classification, c12nDef, 'long', false);
      });
    });
  }

  return actionable && externalLookupResults ? (
    <div>
      {externalLookupResults !== null ? (
        <Button
          onClick={e => {
            e.stopPropagation();
            handleClickOpen();
          }}
          style={iconStyle}
        >
          <InfoOutlinedIcon />
        </Button>
      ) : null}
      <Dialog
        open={openedDialog}
        onClose={handleClose}
        onClick={handleDialogClick}
        scroll={scroll}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        maxWidth="xl"
        // fullWidth
      >
        <DialogTitle id={titleId}>
          {c12nDef.enforce && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: theme.spacing(2) }}>
              <div style={{ flex: 1 }}>
                <Classification c12n={classification} type="outlined" />
              </div>
            </div>
          )}
          <Typography variant="h4">External Results</Typography>
          <Typography>{value}</Typography>
        </DialogTitle>
        <DialogContent dividers={true}>
          <DialogContentText id={descriptionId} ref={descriptionElementRef} tabIndex={-1}>
            <div className={classes.section}>
              <div style={{ display: 'block' }}>
                {Object.entries(externalLookupResults).map(([source, enrichmentResults]) => (
                  <>
                    <div>
                      <Typography variant="h5" sx={{ display: 'inline' }}>
                        {toTitleCase(source)}
                      </Typography>
                      <Divider />
                    </div>

                    <div>{!!enrichmentResults.error ? enrichmentResults.error : null}</div>

                    {enrichmentResults.items.map((enrichmentResult, i) => {
                      return <EnrichmentResult key={i} enrichmentResult={enrichmentResult}></EnrichmentResult>;
                    })}
                    <Divider />
                  </>
                ))}
              </div>
            </div>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  ) : null;
};

const ExternalLinks = React.memo(WrappedExternalLinks);
export default ExternalLinks;
