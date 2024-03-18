import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { AlertTitle, Grid, Pagination, Paper, Skeleton, Tooltip, Typography, useTheme } from '@mui/material';
import TableContainer from '@mui/material/TableContainer';
import makeStyles from '@mui/styles/makeStyles';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import PageCenter from 'commons/components/pages/PageCenter';
import PageFullSize from 'commons/components/pages/PageFullSize';
import useALContext from 'components/hooks/useALContext';
import useDrawer from 'components/hooks/useDrawer';
import useMyAPI from 'components/hooks/useMyAPI';
import { CustomUser } from 'components/hooks/useMyUser';
import ForbiddenPage from 'components/routes/403';
import NotFoundPage from 'components/routes/404';
import { RetrohuntProgress, RetrohuntResult } from 'components/routes/retrohunt';
import RetrohuntErrors from 'components/routes/retrohunt/errors';
import { ChipList } from 'components/visual/ChipList';
import Classification from 'components/visual/Classification';
import CustomChip, { CustomChipProps } from 'components/visual/CustomChip';
import {
  DivTable,
  DivTableBody,
  DivTableCell,
  DivTableHead,
  DivTableRow,
  LinkRow,
  SortableHeaderCell
} from 'components/visual/DivTable';
import FileDetail from 'components/visual/FileDetail';
import InformativeAlert from 'components/visual/InformativeAlert';
import LineGraph from 'components/visual/LineGraph';
import MonacoEditor from 'components/visual/MonacoEditor';
import SearchBar from 'components/visual/SearchBar/search-bar';
import { DEFAULT_SUGGESTION } from 'components/visual/SearchBar/search-textfield';
import SimpleSearchQuery from 'components/visual/SearchBar/simple-search-query';
import { FileResult } from 'components/visual/SearchResult/files';
import SearchResultCount from 'components/visual/SearchResultCount';
import SteppedProgress from 'components/visual/SteppedProgress';
import { safeFieldValue } from 'helpers/utils';
import 'moment/locale/fr';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Moment from 'react-moment';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { RetrohuntRepeat } from './repeat';

const useStyles = makeStyles(theme => ({
  results: {
    fontStyle: 'italic',
    paddingTop: theme.spacing(0.5),
    display: 'flex',
    justifyContent: 'flex-end',
    flexWrap: 'wrap'
  },
  skeletonCustomChip: {
    height: '1.5rem',
    width: '2rem',
    borderRadius: '4px',
    display: 'inline-block',
    verticalAlign: 'middle'
  },
  preview: {
    margin: 0,
    padding: theme.spacing(0.75, 1),
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    backgroundColor: 'inherit'
  }
}));

type RetrohuntHitResult = {
  items: FileResult[];
  offset: number;
  rows: number;
  total: number;
};

type Params = {
  key: string;
};

type Props = {
  search_key?: string;
  isDrawer?: boolean;
};

const PAGE_SIZE = 10;

const MAX_TRACKED_RECORDS = 10000;

const SOCKETIO_NAMESPACE = '/retrohunt';

const DEFAULT_PARAMS = {
  query: '*',
  offset: 0,
  rows: PAGE_SIZE,
  sort: 'seen.last+desc'
};

const DEFAULT_QUERY: string = Object.keys(DEFAULT_PARAMS)
  .map(k => `${k}=${DEFAULT_PARAMS[k]}`)
  .join('&');

function WrappedRetrohuntDetail({ search_key: propKey = null, isDrawer = false }: Props) {
  const { t, i18n } = useTranslation(['retrohunt']);
  const theme = useTheme();
  const classes = useStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const { apiCall } = useMyAPI();
  const { globalDrawerOpened, setGlobalDrawer, closeGlobalDrawer, subscribeCloseDrawer } = useDrawer();
  const { indexes } = useALContext();

  const { c12nDef, configuration } = useALContext();
  const { key: paramKey } = useParams<Params>();
  const { user: currentUser } = useAppUser<CustomUser>();

  const [retrohunt, setRetrohunt] = useState<RetrohuntResult>(null);
  const [status, setStatus] = useState<RetrohuntProgress>(null);
  const [hitResults, setHitResults] = useState<RetrohuntHitResult>(null);
  const [typeDataSet, setTypeDataSet] = useState<{ [k: string]: number }>(null);
  const [isReloading, setIsReloading] = useState<boolean>(true);
  const [query, setQuery] = useState<SimpleSearchQuery>(null);

  const filterValue = useRef<string>('');

  const DEFAULT_RETROHUNT = useMemo<RetrohuntResult>(
    () => ({
      classification: c12nDef.UNRESTRICTED,
      completed_time: null,
      created_time: null,
      creator: null,
      description: '',
      end_group: null,
      errors: [],
      expiry_ts: null,
      finished: null,
      indices: null,
      key: null,
      raw_query: null,
      search_classification: currentUser.classification,
      start_group: null,
      started_time: null,
      total_errors: 0,
      total_hits: 0,
      total_indices: 0,
      truncated: null,
      warnings: [],
      yara_signature: ''
    }),
    [c12nDef.UNRESTRICTED, currentUser.classification]
  );

  const searchKey = useMemo<string>(() => (isDrawer ? propKey.split('?')[0] : paramKey), [isDrawer, paramKey, propKey]);

  const suggestions = useMemo<string[]>(
    () => [...Object.keys(indexes.file).filter(name => indexes.file[name].indexed), ...DEFAULT_SUGGESTION],
    [indexes.file]
  );

  const hitPageCount = useMemo<number>(
    () =>
      hitResults && 'total' in hitResults ? Math.ceil(Math.min(hitResults.total, MAX_TRACKED_RECORDS) / PAGE_SIZE) : 0,
    [hitResults]
  );

  const PageLayout = useCallback<React.FC<any>>(
    props =>
      isDrawer ? (
        <PageFullSize margin={2} {...props} />
      ) : (
        <PageCenter mb={4} ml={0} mr={0} mt={4} width="100%" textAlign="left" {...props} />
      ),
    [isDrawer]
  );

  const handleNavigate = useCallback(
    (searchQuery: SimpleSearchQuery) => {
      const search = new SimpleSearchQuery(searchQuery.toString(), DEFAULT_QUERY);
      if (isDrawer) {
        const delta = search.getDeltaString();
        const searchParam = delta && delta !== '' ? `?${delta}` : '';
        navigate(`${location.pathname}${location.search}#${searchKey}${searchParam}`);
      } else navigate(`${location.pathname}?${search.getDeltaString()}${location.hash}`);
    },
    [isDrawer, location.hash, location.pathname, location.search, navigate, searchKey]
  );

  const handleQueryChange = useCallback(
    (key: string, value: string | number) => {
      query.set(key, value);
      handleNavigate(query);
    },
    [handleNavigate, query]
  );

  const handleQueryRemove = useCallback(
    (key: string | string[]) => {
      if (typeof key === 'string') query.delete(key);
      else key.forEach(k => query.delete(k));
      handleNavigate(query);
    },
    [handleNavigate, query]
  );

  const reloadData = useCallback(
    () => {
      if (currentUser.roles.includes('retrohunt_view') && configuration?.retrohunt?.enabled) {
        apiCall({
          url: `/api/v4/retrohunt/${searchKey}/`,
          onSuccess: api_data => setRetrohunt({ ...DEFAULT_RETROHUNT, ...api_data.api_response }),
          onEnter: () => setIsReloading(true),
          onExit: () => setIsReloading(false)
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser.roles, configuration?.retrohunt?.enabled, searchKey, DEFAULT_RETROHUNT]
  );

  const reloadHits = useCallback(
    (curQuery: SimpleSearchQuery) => {
      if (currentUser.roles.includes('retrohunt_view') && configuration?.retrohunt?.enabled) {
        apiCall({
          method: 'POST',
          url: `/api/v4/retrohunt/hits/${searchKey}/`,
          body: {
            ...curQuery.getParams(),
            filters: curQuery.getAll('filters', [])
          },
          onSuccess: api_data => {
            const { items, total, rows, offset } = api_data.api_response;
            if (items.length === 0 && offset !== 0 && offset >= total) {
              curQuery.set('offset', Math.floor(total / rows) * rows);
              reloadHits(curQuery);
            } else {
              setHitResults(api_data.api_response);
            }
          },
          onEnter: () => setIsReloading(true),
          onExit: () => setIsReloading(false)
        });
        apiCall({
          method: 'POST',
          url: `/api/v4/retrohunt/types/${searchKey}/`,
          body: {
            query: curQuery.get('query', DEFAULT_PARAMS?.query),
            filters: curQuery.getAll('filters', [])
          },
          onSuccess: api_data => {
            let dataset: { [k: string]: number } = api_data.api_response;
            dataset = Object.fromEntries(
              Object.keys(dataset)
                .sort((a, b) => dataset[b] - dataset[a])
                .map(k => [k, dataset[k]])
            );
            setTypeDataSet(dataset);
          }
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser.roles, configuration?.retrohunt?.enabled, searchKey]
  );

  const handleHitRowClick = useCallback(
    (file: FileResult) => {
      if (isDrawer) navigate(`/file/detail/${file.sha256}${location.hash}`);
      else navigate(`${location.pathname}${location.search}#${file.sha256}`);
    },
    [isDrawer, location.hash, location.pathname, location.search, navigate]
  );

  useEffect(() => {
    if (isDrawer) {
      const url = new URL(`${window.location.origin}/${location.hash.slice(1)}`);
      setQuery(new SimpleSearchQuery(url.search, DEFAULT_QUERY));
    }
  }, [isDrawer, location.hash]);

  useEffect(() => {
    if (!isDrawer) setQuery(new SimpleSearchQuery(location.search, DEFAULT_QUERY));
  }, [isDrawer, location.search]);

  useEffect(() => {
    reloadData();
  }, [searchKey, reloadData]);

  useEffect(() => {
    if (query && status === null) reloadHits(query);
  }, [query, reloadHits, status]);

  useEffect(() => {
    if (!isDrawer && location.hash) {
      setGlobalDrawer(<FileDetail sha256={location.hash.substr(1)} />, { hasMaximize: true });
    }
  }, [isDrawer, location.hash, setGlobalDrawer]);

  useEffect(() => {
    if (hitResults !== null && !globalDrawerOpened && location.hash) {
      navigate(`${location.pathname}${location.search ? location.search : ''}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalDrawerOpened]);

  useEffect(() => {
    if (isDrawer) {
      subscribeCloseDrawer(() =>
        navigate(`${window.location.pathname}${window.location.search ? window.location.search : ''}`)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawer, subscribeCloseDrawer]);

  useEffect(() => {
    if (!['/retrohunt', '/file/detail'].some(p => location.pathname.startsWith(p))) closeGlobalDrawer();
  }, [closeGlobalDrawer, location.pathname]);

  useEffect(() => {
    if (!searchKey) return;

    const socket = io(SOCKETIO_NAMESPACE);

    socket.on('connect', () => {
      socket.emit('listen', { key: searchKey });
      // eslint-disable-next-line no-console
      console.debug('Socket-IO :: Connecting to socketIO server...');
    });

    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.debug('Socket-IO :: Disconnected from socketIO server.');
    });
    // eslint-disable-next-line no-console
    socket.on('status', (data: RetrohuntProgress) => {
      if (data.type === 'Finished') {
        setRetrohunt({
          ...data.search,
          total_errors: data.search.errors.length,
          total_warnings: data.search.warnings.length
        });
        setStatus(null);
      } else {
        setStatus(data);
      }
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  if (!configuration?.retrohunt?.enabled) return <NotFoundPage />;
  else if (!currentUser.roles.includes('retrohunt_view')) return <ForbiddenPage />;
  else
    return (
      <PageLayout>
        <Grid container flexDirection="column" flexWrap="nowrap" flex={1} rowGap={2} marginBottom={theme.spacing(4)}>
          {c12nDef.enforce && (
            <Grid item paddingBottom={1}>
              <Classification
                format="long"
                type="pill"
                size="small"
                c12n={retrohunt && 'classification' in retrohunt ? retrohunt.classification : null}
              />
            </Grid>
          )}

          <Grid item>
            <Grid container flexDirection="row" rowGap={2}>
              <Grid item flex={1}>
                <Typography variant="h4" children={!retrohunt ? <Skeleton width="30rem" /> : t('header.view')} />
                <Typography variant="caption" children={!retrohunt ? <Skeleton width="20rem" /> : retrohunt.key} />
              </Grid>
              <Grid item flex={0}>
                <Grid container flexDirection="row" rowGap={2} wrap="nowrap">
                  {retrohunt && retrohunt.finished === true && <RetrohuntRepeat retrohunt={retrohunt} />}
                  {retrohunt && (retrohunt.total_warnings > 0 || retrohunt.total_errors > 0) && (
                    <RetrohuntErrors retrohunt={retrohunt} />
                  )}
                </Grid>
              </Grid>
            </Grid>

            {!status ? null : (
              <Grid item paddingTop={2}>
                <Grid container flexDirection="row" justifyContent="center">
                  <Grid item xs={12} sm={11} lg={10}>
                    <SteppedProgress
                      activeStep={['Filtering', 'Yara', 'Finished'].indexOf(status.type)}
                      percentage={status.type === 'Filtering' || status.type === 'Yara' ? 100 * status?.progress : 0}
                      show100
                      steps={[
                        { label: t('step.filtering'), icon: <FilterAltOutlinedIcon /> },
                        { label: t('step.yara'), icon: <DataObjectOutlinedIcon /> },
                        { label: t('step.finished'), icon: <DoneOutlinedIcon /> }
                      ]}
                    />
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>

          <Grid item>
            <Typography variant="subtitle2" paddingBottom={0.5}>
              {t('details.description')}
            </Typography>
            {!retrohunt ? (
              <Skeleton style={{ height: '2.5rem' }} />
            ) : (
              <Paper component="pre" variant="outlined" className={classes.preview}>
                {retrohunt?.description}
              </Paper>
            )}
          </Grid>

          <Grid item>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" paddingBottom={0.5}>
                  {t('details.created')}
                </Typography>
                {!retrohunt ? (
                  <Skeleton style={{ height: '2.5rem' }} />
                ) : (
                  <Paper className={classes.preview} component="pre" variant="outlined">
                    {retrohunt.creator}
                    {' ('}
                    <Moment fromNow locale={i18n.language}>
                      {retrohunt.created_time}
                    </Moment>
                    {')'}
                  </Paper>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" paddingBottom={0.5}>
                  {t('details.expiry')}
                </Typography>
                {!retrohunt ? (
                  <Skeleton style={{ height: '2.5rem' }} />
                ) : (
                  <Paper className={classes.preview} component="pre" variant="outlined">
                    <Moment
                      format={
                        i18n.language === 'en'
                          ? 'MMMM Do YYYY'
                          : i18n.language === 'fr'
                          ? 'Do MMMM YYYY'
                          : 'MMMM Do YYYY'
                      }
                      locale={i18n.language}
                    >
                      {retrohunt.expiry_ts}
                    </Moment>
                    {' ('}
                    <Moment fromNow locale={i18n.language}>
                      {retrohunt.expiry_ts}
                    </Moment>
                    {')'}
                  </Paper>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" paddingBottom={0.5}>
                  {t('details.search')}
                </Typography>
                {!retrohunt ? (
                  <Skeleton style={{ height: '2.5rem' }} />
                ) : (
                  <Paper className={classes.preview} component="pre" variant="outlined">
                    {retrohunt?.archive_only ? t('details.archive_only') : t('details.all')}
                  </Paper>
                )}
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <Tooltip title={t('tooltip.search_classification')} placement="top">
              <div
                style={{
                  display: 'inline-flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing(1),
                  marginBottom: theme.spacing(0.5)
                }}
              >
                <Typography variant="subtitle2">{t('details.search_classification')}</Typography>
                <InfoOutlinedIcon />
              </div>
            </Tooltip>
            <Classification
              format="long"
              type="pill"
              size="small"
              c12n={retrohunt && 'search_classification' in retrohunt ? retrohunt.search_classification : null}
            />
          </Grid>

          <Grid item>
            {!retrohunt ? (
              <Skeleton style={{ height: '100%', minHeight: '450px', transform: 'none' }} />
            ) : (
              <Grid container flexDirection="column" height="100%" minHeight="450px">
                <MonacoEditor
                  language="yara"
                  value={'yara_signature' in retrohunt ? retrohunt.yara_signature : ''}
                  options={{ readOnly: true }}
                />
              </Grid>
            )}
          </Grid>

          <Grid item>
            <Grid container gap={1}>
              <Grid item xs={12} marginTop={1}>
                <Typography variant="h6">{t('header.results')}</Typography>
              </Grid>
              {!retrohunt ? (
                <Grid item>
                  <Skeleton className={classes.skeletonCustomChip} variant="rectangular" />
                </Grid>
              ) : (
                'truncated' in retrohunt &&
                retrohunt.truncated && (
                  <Grid item>
                    <Tooltip title={t('truncated.tooltip')}>
                      <span>
                        <CustomChip type="round" size="small" variant="outlined" color="error" label={t('truncated')} />
                      </span>
                    </Tooltip>
                  </Grid>
                )
              )}

              {!retrohunt ? (
                <Grid item>
                  <Skeleton className={classes.skeletonCustomChip} variant="rectangular" />
                </Grid>
              ) : (
                'tags' in retrohunt &&
                Object.keys(retrohunt.tags).length > 0 &&
                Object.keys(retrohunt.tags).map((key, i) => (
                  <Grid item>
                    <CustomChip
                      key={'tag-' + i}
                      type="round"
                      size="small"
                      variant="outlined"
                      color="default"
                      label={key}
                    />
                  </Grid>
                ))
              )}
            </Grid>
          </Grid>

          <Grid item>
            {!retrohunt ? (
              <Skeleton style={{ height: '100%', transform: 'none', marginTop: theme.spacing(1) }} />
            ) : (
              <SearchBar
                initValue={query ? query.get('query', '') : ''}
                placeholder={t('hits.filter')}
                searching={isReloading}
                suggestions={suggestions}
                onValueChange={value => {
                  filterValue.current = value;
                }}
                onClear={() => handleQueryRemove(['query', 'rows', 'offset'])}
                onSearch={() => {
                  if (filterValue.current !== '') {
                    handleQueryChange('query', filterValue.current);
                    handleQueryChange('offset', 0);
                  } else handleQueryRemove(['query', 'rows', 'offset']);
                }}
              >
                <div className={classes.results}>
                  {hitResults && hitResults.total !== 0 && (
                    <Typography variant="subtitle1" color="secondary" style={{ flexGrow: 1 }}>
                      {isReloading ? (
                        <span>{t('searching')}</span>
                      ) : (
                        <span>
                          <SearchResultCount count={hitResults.total} />
                          {query.get('query') || query.get('filters')
                            ? t(`hits.filtered${hitResults.total === 1 ? '' : 's'}`)
                            : t(`hits.total${hitResults.total === 1 ? '' : 's'}`)}
                        </span>
                      )}
                    </Typography>
                  )}
                  {hitPageCount > 1 && (
                    <Pagination
                      page={Math.ceil(1 + query.get('offset') / PAGE_SIZE)}
                      onChange={(e, value) => handleQueryChange('offset', (value - 1) * PAGE_SIZE)}
                      count={hitPageCount}
                      shape="rounded"
                      size="small"
                    />
                  )}
                </div>
                {query && (
                  <div>
                    <ChipList
                      items={query.getAll('filters', []).map(
                        f =>
                          ({
                            color: f.indexOf('NOT ') === 0 ? 'error' : null,
                            label: `${f}`,
                            variant: 'outlined',
                            onClick: () => {
                              query.replace(
                                'filters',
                                f,
                                f.indexOf('NOT ') === 0 ? f.substring(5, f.length - 1) : `NOT (${f})`
                              );
                              handleNavigate(query);
                            },
                            onDelete: () => {
                              query.remove('filters', f);
                              handleNavigate(query);
                            }
                          } as CustomChipProps)
                      )}
                    />
                  </div>
                )}
              </SearchBar>
            )}
          </Grid>

          <Grid item>
            <LineGraph
              dataset={typeDataSet}
              height="200px"
              title={t('graph.type.title')}
              datatype={t('graph.type.datatype')}
              onClick={(evt, element) => {
                if (!isReloading && element.length > 0) {
                  var ind = element[0].index;
                  query.add('filters', `type:${safeFieldValue(Object.keys(typeDataSet)[ind])}`);
                  handleNavigate(query);
                }
              }}
            />
          </Grid>

          <Grid item>
            {!hitResults ? (
              <Skeleton variant="rectangular" style={{ height: '6rem', borderRadius: '4px' }} />
            ) : hitResults.total === 0 ? (
              <div style={{ width: '100%' }}>
                <InformativeAlert>
                  <AlertTitle>{t('no_results_title')}</AlertTitle>
                  {t('no_results_desc')}
                </InformativeAlert>
              </div>
            ) : (
              <TableContainer
                id="hits-table"
                component={Paper}
                sx={{ border: isDrawer && `1px solid ${theme.palette.divider}` }}
              >
                <DivTable stickyHeader>
                  <DivTableHead>
                    <DivTableRow>
                      <SortableHeaderCell
                        query={query}
                        children={t('details.lasttimeseen')}
                        sortName="sort"
                        sortField="seen.last"
                        onSort={(e, { name, field }) => handleQueryChange(name, field)}
                        sx={{ zIndex: 'auto' }}
                      />
                      <SortableHeaderCell
                        query={query}
                        children={t('details.count')}
                        sortName="sort"
                        sortField="seen.count"
                        onSort={(e, { name, field }) => handleQueryChange(name, field)}
                        sx={{ zIndex: 'auto' }}
                      />
                      <SortableHeaderCell
                        query={query}
                        children={t('details.sha256')}
                        sortName="sort"
                        sortField="sha256"
                        onSort={(e, { name, field }) => handleQueryChange(name, field)}
                        sx={{ zIndex: 'auto' }}
                      />
                      <SortableHeaderCell
                        query={query}
                        children={t('details.filetype')}
                        sortName="sort"
                        sortField="type"
                        onSort={(e, { name, field }) => handleQueryChange(name, field)}
                        sx={{ zIndex: 'auto' }}
                      />
                      <SortableHeaderCell
                        query={query}
                        children={t('details.size')}
                        sortName="sort"
                        sortField="size"
                        onSort={(e, { name, field }) => handleQueryChange(name, field)}
                        sx={{ zIndex: 'auto' }}
                      />
                      {c12nDef.enforce && (
                        <SortableHeaderCell
                          query={query}
                          children={t('details.classification')}
                          sortName="sort"
                          sortField="classification"
                          onSort={(e, { name, field }) => handleQueryChange(name, field)}
                          sx={{ zIndex: 'auto' }}
                        />
                      )}
                      <DivTableCell sx={{ zIndex: 'auto' }} />
                    </DivTableRow>
                  </DivTableHead>
                  <DivTableBody id="hit-body">
                    {hitResults.items.map((file, i) => (
                      <LinkRow
                        key={i}
                        component={Link}
                        to={`/file/detail/${file.sha256}`}
                        hover
                        style={{ textDecoration: 'none' }}
                        onClick={event => {
                          event.preventDefault();
                          handleHitRowClick(file);
                        }}
                        selected={
                          isDrawer
                            ? location.pathname.endsWith(`/${file?.sha256}`)
                            : location.hash.startsWith(`#${file?.sha256}`)
                        }
                      >
                        <DivTableCell>
                          <Tooltip title={file.seen.last}>
                            <>
                              <Moment fromNow locale={i18n.language}>
                                {file.seen.last}
                              </Moment>
                            </>
                          </Tooltip>
                        </DivTableCell>
                        <DivTableCell>{file.seen.count}</DivTableCell>
                        <DivTableCell breakable>{file.sha256}</DivTableCell>
                        <DivTableCell>{file.type}</DivTableCell>
                        <DivTableCell>{file.size}</DivTableCell>
                        {c12nDef.enforce && (
                          <DivTableCell>
                            <Classification type="text" size="tiny" c12n={file.classification} format="short" />
                          </DivTableCell>
                        )}
                        <DivTableCell style={{ textAlign: 'center' }}>
                          {file.from_archive && (
                            <Tooltip title={t('archive')}>
                              <ArchiveOutlinedIcon />
                            </Tooltip>
                          )}
                        </DivTableCell>
                      </LinkRow>
                    ))}
                  </DivTableBody>
                </DivTable>
              </TableContainer>
            )}
          </Grid>
        </Grid>
      </PageLayout>
    );
}

export const RetrohuntDetail = React.memo(WrappedRetrohuntDetail);
export default WrappedRetrohuntDetail;
