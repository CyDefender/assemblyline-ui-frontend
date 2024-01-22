import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  AlertTitle,
  CircularProgress,
  Collapse,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Skeleton,
  TableContainer,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import useClipboard from 'commons/components/utils/hooks/useClipboard';
import useALContext from 'components/hooks/useALContext';
import useMyAPI from 'components/hooks/useMyAPI';
import useMySnackbar from 'components/hooks/useMySnackbar';
import useSafeResults from 'components/hooks/useSafeResults';
import ActionMenu from 'components/visual/ActionMenu';
import Classification from 'components/visual/Classification';
import {
  GridLinkRow,
  GridTable,
  GridTableBody,
  GridTableCell,
  GridTableHead,
  GridTableRow,
  SortableGridHeaderCell,
  StyledPaper
} from 'components/visual/GridTable';
import InformativeAlert from 'components/visual/InformativeAlert';
import InputDialog from 'components/visual/InputDialog';
import SimpleSearchQuery from 'components/visual/SearchBar/simple-search-query';
import ResultsTable, { ResultResult } from 'components/visual/SearchResult/results';
import SectionContainer from 'components/visual/SectionContainer';
import Verdict from 'components/visual/Verdict';
import { safeFieldValue } from 'helpers/utils';
import 'moment/locale/fr';
import React, { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AutoSizer from 'react-virtualized-auto-sizer';

export type Signature = [string, string, boolean]; // [name, h_type, safelisted]

export type Tag = [string, string, boolean, string]; // [value, h_type, safelisted, classification]

type Result = {
  tag_type: string;
  value: string;
  h_type: string;
  safelisted: boolean;
  classification: string;
};

type ArchivedTagSectionProps = {
  sha256: string;
  signatures: Signature[];
  tags: Record<string, Tag[]>;
  force?: boolean;
  drawer?: boolean;
  nocollapse?: boolean;
};

const VERDICT_MAP = {
  malicious: 4,
  highly_suspicious: 3,
  suspicious: 2,
  info: 1,
  safe: 0
};

const WrappedArchivedTagSection: React.FC<ArchivedTagSectionProps> = ({
  sha256,
  signatures,
  tags,
  force = false,
  drawer = true,
  nocollapse = false
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['archive']);
  const { c12nDef } = useALContext();
  const { showSafeResults } = useSafeResults();

  const [query, setQuery] = useState<SimpleSearchQuery>(new SimpleSearchQuery(''));

  const results = useMemo<Result[]>(() => {
    const signatureResults = !signatures
      ? []
      : signatures.map(item => ({
          tag_type: 'heuristic.signature',
          value: item[0],
          h_type: item[1],
          safelisted: item[2],
          classification: ''
        }));

    const tagResults = !tags
      ? []
      : Object.entries(tags).flatMap(([tagType, items]) =>
          items.map(item => ({
            tag_type: tagType,
            value: item[0],
            h_type: item[1],
            safelisted: item[2],
            classification: item[3]
          }))
        );

    return [...signatureResults, ...tagResults].sort((a, b) =>
      a?.tag_type !== b?.tag_type
        ? 0
        : (b?.h_type in VERDICT_MAP ? VERDICT_MAP[b.h_type] : 0) -
          (a?.h_type in VERDICT_MAP ? VERDICT_MAP[a.h_type] : 0)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sha256, signatures, tags]);

  const filteredResults = useMemo<Result[]>(() => {
    if (!results) return null;

    const newResults = JSON.parse(JSON.stringify(results));
    if (query.toString() === '') return newResults;

    return newResults.filter((result: Result) =>
      Object.entries(result).every(([key, value]) => {
        if (key === 'h_type') {
          return query.get(key, '') === '' ? true : query.get(key, '').split(',').includes(value.toString());
        } else {
          return !!value.toString().match(query.get(key, ''));
        }
      })
    );
  }, [query, results]);

  const sortedResults = useMemo<Result[]>(() => {
    if (!filteredResults) return null;

    const newResults = JSON.parse(JSON.stringify(filteredResults));
    if (query.toString() === '') return newResults;

    const sort = new SimpleSearchQuery(query.toString(), null).get('sort', 'tag_type asc');
    const dir = sort && sort.indexOf('asc') !== -1 ? 'asc' : 'desc';
    const field = sort.replace(' asc', '').replace(' desc', '') as keyof Result;

    if (!field || newResults?.length === 0 || !(field in newResults[0])) return newResults;
    else if (field === 'h_type')
      return newResults.toSorted((a, b) =>
        dir === 'asc'
          ? (a?.h_type in VERDICT_MAP ? VERDICT_MAP[a.h_type] : 0) -
            (b?.h_type in VERDICT_MAP ? VERDICT_MAP[b.h_type] : 0)
          : (b?.h_type in VERDICT_MAP ? VERDICT_MAP[b.h_type] : 0) -
            (a?.h_type in VERDICT_MAP ? VERDICT_MAP[a.h_type] : 0)
      );
    else
      return newResults.toSorted((a, b) =>
        dir === 'asc'
          ? (a[field] as any).localeCompare(b[field] as any)
          : (b[field] as any).localeCompare(a[field] as any)
      );
  }, [filteredResults, query]);

  const groupedResults = useMemo<Array<Result[]>>(
    () =>
      sortedResults.reduce((prev: Array<Result[]>, curr: Result, i: number, array: Result[]) => {
        // const node = prev.find(item => item.find((subItem, subI) => subItem?.tag_type === curr?.tag_type));
        const node =
          Array.isArray(prev) &&
          prev?.length > 0 &&
          prev[prev.length - 1].find(subItem => subItem?.tag_type === curr?.tag_type)
            ? prev[prev.length - 1]
            : null;

        if (node) node.push(curr);
        else prev.push([curr]);

        return prev;
      }, []),
    [sortedResults]
  );

  const tagUnsafeMap = useMemo(() => {
    if (!tags) return null;
    const newTagUnsafeMap = {};
    for (const tType of Object.keys(tags)) {
      newTagUnsafeMap[tType] = tags[tType].some(i => i[1] !== 'safe' && !i[2]);
    }
    return newTagUnsafeMap;
  }, [tags]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const someSigNotSafe = useMemo(() => signatures && signatures.some(i => i[1] !== 'safe' && !i[2]), [signatures]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const forceShowSig = useMemo(
    () => signatures && signatures.length !== 0 && (showSafeResults || force),
    [force, showSafeResults, signatures]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const someTagNotSafe = useMemo(() => tagUnsafeMap && Object.values(tagUnsafeMap).some(Boolean), [tagUnsafeMap]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const forceShowTag = useMemo(
    () => tagUnsafeMap && Object.keys(tagUnsafeMap).length !== 0 && (showSafeResults || force),
    [force, showSafeResults, tagUnsafeMap]
  );

  const handleSort = useCallback((event: any, { field }: { field: string }) => {
    setQuery(prev => {
      const q = new SimpleSearchQuery(prev.toString(), '');
      q.set('sort', field);
      return q;
    });
  }, []);

  const handleSortClear = useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    event.stopPropagation();
    setQuery(new SimpleSearchQuery('', ''));
  }, []);

  const handleFilter = useCallback((key: string, value: string) => {
    setQuery(q => {
      const newQuery = new SimpleSearchQuery(q.toString(), '');
      if (value === '') newQuery.delete(key);
      else newQuery.set(key, value);
      return newQuery;
    });
  }, []);

  return (
    <SectionContainer
      title={t('tags')}
      nocollapse={nocollapse}
      variant="flex"
      slots={{
        end: sortedResults && sortedResults?.length > 0 && (
          <Typography
            color="secondary"
            variant="subtitle1"
            children={`${sortedResults?.length} ${t('tags', { ns: 'fileDetail' })}`}
            sx={{ fontStyle: 'italic' }}
          />
        )
      }}
    >
      {!results ? (
        <Skeleton variant="rectangular" style={{ height: '6rem', borderRadius: '4px' }} />
      ) : results?.length === 0 ? (
        <div style={{ width: '100%' }}>
          <InformativeAlert>
            <AlertTitle>{t('no_tag_title')}</AlertTitle>
            {t('no_tag_desc')}
          </InformativeAlert>
        </div>
      ) : (
        <>
          <div
            style={{
              flexGrow: 1,
              border: `1px solid ${theme.palette.divider}`,
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
              <AutoSizer style={{ display: 'flex', height: '100%', width: '100%' }}>
                {({ width, height }) => (
                  <TableContainer component={StyledPaper} original={drawer} style={{ overflowX: 'hidden' }}>
                    <GridTable
                      columns={c12nDef.enforce ? 5 : 4}
                      stickyHeader
                      paper={!drawer}
                      size="small"
                      style={{
                        gridTemplateColumns: c12nDef.enforce
                          ? `minmax(auto, 1fr) 125px minmax(auto, 3fr) minmax(auto, 1fr) min-content`
                          : `minmax(auto, 1fr) 125px minmax(auto, 3fr) min-content`,
                        maxHeight: height,
                        width: width
                      }}
                    >
                      <GridTableHead>
                        <GridTableRow>
                          <SortableGridHeaderCell
                            allowSort
                            children={t('type')}
                            query={query}
                            sortField="tag_type"
                            onSort={handleSort}
                          />
                          <SortableGridHeaderCell
                            allowSort
                            children={t('verdict')}
                            query={query}
                            sortField="h_type"
                            inverted
                            onSort={handleSort}
                          />
                          <SortableGridHeaderCell
                            allowSort
                            children={t('value')}
                            query={query}
                            sortField="value"
                            onSort={handleSort}
                          />
                          {c12nDef.enforce && (
                            <SortableGridHeaderCell
                              allowSort
                              children={t('classification')}
                              query={query}
                              sortField="classification"
                              onSort={handleSort}
                            />
                          )}
                          <GridTableCell variant="head" sx={{ justifyItems: 'flex-end' }}>
                            <Tooltip title={t('tags.tooltip.clear')}>
                              <IconButton color="inherit" size="small" onClick={handleSortClear}>
                                <CloseOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </GridTableCell>
                        </GridTableRow>
                        <GridTableRow>
                          <FilterCell onChange={value => handleFilter('tag_type', value)} />
                          <SelectCell onChange={value => handleFilter('h_type', value)} />
                          <FilterCell onChange={value => handleFilter('value', value)} />
                          <FilterCell onChange={value => handleFilter('classification', value)} />
                          <GridTableCell variant="head" sx={{ position: 'sticky', top: '43px' }} />
                        </GridTableRow>
                      </GridTableHead>
                      <GridTableBody>
                        {groupedResults.map((items, i) => (
                          <GroupedRow key={i} results={items} sha256={sha256} force={force} drawer={drawer} />
                        ))}
                      </GridTableBody>
                    </GridTable>
                  </TableContainer>
                )}
              </AutoSizer>
            </div>
          </div>
        </>
      )}
    </SectionContainer>
  );
};

type GroupedRowProps = {
  drawer?: boolean;
  force?: boolean;
  results: Result[];
  sha256: string;
};

const WrappedGroupedRow = ({ drawer = true, force = false, results = [], sha256 }: GroupedRowProps) => {
  const { t } = useTranslation(['archive']);

  const [showMore, setShowMore] = useState<boolean>(false);

  return (
    <>
      {results &&
        results?.length > 0 &&
        (showMore ? results : results.filter((r, i) => i < 10)).map(
          ({ tag_type, value, h_type, safelisted, classification }) => (
            <Row
              key={`${tag_type}-${value}-${h_type}-${safelisted}-${classification}`}
              tag_type={tag_type}
              value={value}
              h_type={h_type}
              safelisted={safelisted}
              classification={classification}
              sha256={sha256}
              force={force}
              drawer={drawer}
            />
          )
        )}
      {!showMore && results?.length > 10 && (
        <GridTableRow hover sx={{ cursor: 'pointer', textDecoration: 'none' }} onClick={() => setShowMore(true)}>
          <GridTableCell sx={{ gridColumn: 'span 5', '&.MuiTableCell-root>div': { justifyItems: 'center' } }}>{`+ ${
            results?.length - 10
          } ${results?.length - 10 <= 1 ? t('row') : t('rows')}`}</GridTableCell>
        </GridTableRow>
      )}
    </>
  );
};

const GroupedRow = React.memo(WrappedGroupedRow);

type RowProps = {
  tag_type: string;
  value: string;
  h_type: string;
  safelisted: boolean;
  classification: string;
  sha256: string;
  force: boolean;
  drawer?: boolean;
};

const initialMenuState = {
  mouseX: null,
  mouseY: null
};

const WrappedRow: React.FC<RowProps> = ({
  tag_type,
  value,
  h_type,
  safelisted,
  classification,
  sha256,
  force = false,
  drawer = false
}) => {
  const { t } = useTranslation(['archive']);
  const theme = useTheme();

  const { apiCall } = useMyAPI();
  const { c12nDef } = useALContext();
  const { showErrorMessage } = useMySnackbar();
  const { showSuccessMessage } = useMySnackbar();
  const { copy } = useClipboard();
  const { user: currentUser } = useALContext();

  const [resultResults, setResultResults] = useState<{
    items: ResultResult[];
    offset: number;
    rows: number;
    total: number;
  }>(null);
  const [error, setError] = useState<string>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [render, setRender] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [state, setState] = useState(initialMenuState);
  const [safelistDialog, setSafelistDialog] = useState<boolean>(false);
  const [safelistReason, setSafelistReason] = useState<string>(null);
  const [waitingDialog, setWaitingDialog] = useState<boolean>(false);

  useEffect(() => {
    if (!sha256 || !tag_type || !value || !open || !!resultResults) return;
    apiCall({
      method: 'POST',
      url: `/api/v4/search/result/`,
      body: {
        query:
          tag_type === 'heuristic.signature'
            ? `result.sections.heuristic.signature.name:${safeFieldValue(value)}`
            : `result.sections.tags.${tag_type}:${safeFieldValue(value)}`,
        rows: 10,
        offset: 0,
        filters: [`NOT(sha256:${sha256})`]
      },
      onSuccess: api_data => {
        if (api_data.api_response?.total > 0) setResultResults(api_data.api_response);
        else setError('no_results_title');
      },
      onFailure: api_data => {
        setError(api_data.api_error_message);
        showErrorMessage(api_data.api_error_message);
      },
      onEnter: () => setLoading(true),
      onExit: () => setLoading(false)
    });
    // eslint-disable-next-line
  }, [open, resultResults, sha256, tag_type, value]);

  const addToSafelist = useCallback(() => {
    const data = {
      signature: {
        name: value
      },
      sources: [
        {
          name: currentUser.username,
          reason: [safelistReason],
          type: 'user'
        }
      ],
      type: 'signature'
    };

    apiCall({
      url: `/api/v4/safelist/`,
      method: 'PUT',
      body: data,
      onSuccess: _ => {
        setSafelistDialog(false);
        showSuccessMessage(t('safelist.success'));
      },
      onEnter: () => setWaitingDialog(true),
      onExit: () => setWaitingDialog(false)
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safelistReason, t, value]);

  const handleRowClick = useCallback((event: React.MouseEvent<any>) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(v => !v);
  }, []);

  const handleMenuClick = useCallback((event: React.MouseEvent<any>) => {
    event.preventDefault();
    setState({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4
    });
  }, []);

  const handleClose = useCallback(() => {
    setState(initialMenuState);
  }, []);

  const handleMenuCopy = useCallback(() => {
    copy(value, 'clipID');
    handleClose();
  }, [copy, handleClose, value]);

  const handleMenuSafelist = useCallback(() => {
    setSafelistDialog(true);
    handleClose();
  }, [setSafelistDialog, handleClose]);

  return (
    <>
      {tag_type === 'heuristic.signature' ? (
        <>
          <InputDialog
            open={safelistDialog}
            handleClose={() => setSafelistDialog(false)}
            handleAccept={addToSafelist}
            handleInputChange={event => setSafelistReason(event.target.value)}
            inputValue={safelistReason}
            title={t('safelist.title')}
            cancelText={t('safelist.cancelText')}
            acceptText={t('safelist.acceptText')}
            inputLabel={t('safelist.input')}
            text={t('safelist.text')}
            waiting={waitingDialog}
          />
          <Menu
            open={state.mouseY !== null}
            onClose={handleClose}
            anchorReference="anchorPosition"
            anchorPosition={
              state.mouseY !== null && state.mouseX !== null ? { top: state.mouseY, left: state.mouseX } : undefined
            }
          >
            <MenuItem dense onClick={handleMenuCopy}>
              <AssignmentOutlinedIcon style={{ marginRight: '16px' }} />
              {t('clipboard')}
            </MenuItem>
            {currentUser.roles.includes('submission_view') && (
              <MenuItem
                component={Link}
                dense
                onClick={handleClose}
                to={`/search/result?query=result.sections.${tag_type}.name:${safeFieldValue(value)}`}
              >
                <SearchOutlinedIcon style={{ marginRight: '16px' }} />
                {t('related')}
              </MenuItem>
            )}
            {currentUser.roles.includes('safelist_manage') && (
              <MenuItem dense onClick={handleMenuSafelist}>
                <PlaylistAddCheckOutlinedIcon style={{ marginRight: '16px' }} />
                {t('safelist')}
              </MenuItem>
            )}
          </Menu>
        </>
      ) : (
        <ActionMenu
          category={'tag'}
          type={tag_type}
          value={value}
          state={state}
          setState={setState}
          classification={classification}
        />
      )}
      <GridLinkRow
        hover
        to={
          tag_type === 'heuristic.signature'
            ? `/search/result?query=result.sections.${tag_type}.name:${safeFieldValue(value)}`
            : `/search/result?query=result.sections.tags.${tag_type}:${safeFieldValue(value)}`
        }
        onClick={handleRowClick}
        onContextMenu={handleMenuClick}
      >
        <GridTableCell children={tag_type} />
        <GridTableCell children={<Verdict verdict={h_type as any} fullWidth pointer />} />
        <GridTableCell breakable children={value} />
        {c12nDef.enforce && (
          <GridTableCell
            children={
              classification !== '' ? (
                <Classification type="text" size="tiny" c12n={classification} format="short" />
              ) : (
                ''
              )
            }
          />
        )}
        <GridTableCell
          sx={{ '&.MuiTableCell-root>div': { justifyItems: 'flex-end', '&>div': { padding: '0px 5px' } } }}
        >
          {error && error !== '' ? (
            <Tooltip title={t(error)} placement="left">
              <div>
                <InfoOutlinedIcon />
              </div>
            </Tooltip>
          ) : loading ? (
            <CircularProgress color="inherit" style={{ height: '20px', width: '20px' }} />
          ) : open ? (
            <Tooltip title={t('tags.less')} placement="left">
              <div>
                <KeyboardArrowUpIcon fontSize="small" />
              </div>
            </Tooltip>
          ) : (
            <Tooltip title={t('tags.more')} placement="left">
              <div>
                <KeyboardArrowDownIcon fontSize="small" />
              </div>
            </Tooltip>
          )}
        </GridTableCell>
      </GridLinkRow>

      <GridTableRow>
        <GridTableCell sx={{ gridColumn: 'span 5', padding: 0 }}>
          <Collapse in={open && resultResults?.total > 0} timeout="auto" onEnter={() => setRender(true)}>
            {render && (
              <div style={{ paddingTop: theme.spacing(2), paddingBottom: theme.spacing(2) }}>
                <ResultsTable
                  component={props => <StyledPaper {...props} original={!drawer} />}
                  resultResults={resultResults}
                  allowSort={false}
                />
              </div>
            )}
          </Collapse>
        </GridTableCell>
      </GridTableRow>
    </>
  );
};

const Row = React.memo(WrappedRow);

type FilterFieldProps = {
  onChange: (value: string) => void;
};

const FilterCell: React.FC<FilterFieldProps> = React.memo(({ onChange = () => null }: FilterFieldProps) => {
  const [value, setValue] = useState<string>('');
  const [, startTransition] = useTransition();

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setValue(event.target.value);
      startTransition(() => onChange(event.target.value));
    },
    [onChange]
  );

  const handleClear = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      setValue('');
      startTransition(() => onChange(''));
    },
    [onChange]
  );

  return (
    <GridTableCell variant="head" sx={{ position: 'sticky', top: '43px' }}>
      <OutlinedInput
        value={value}
        size="small"
        onChange={handleChange}
        endAdornment={
          <InputAdornment position="end">
            <IconButton edge="end" onClick={event => handleClear(event)}>
              <CancelIcon color="secondary" />
            </IconButton>
          </InputAdornment>
        }
      />
    </GridTableCell>
  );
});

const SelectCell: React.FC<FilterFieldProps> = React.memo(({ onChange = () => null }: FilterFieldProps) => {
  const [value, setValue] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  const handleChange = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
      setValue(newValue);
      startTransition(() => onChange(newValue.join(',')));
    },
    [onChange]
  );

  return (
    <GridTableCell variant="head" sx={{ position: 'sticky', top: '43px' }}>
      <Select
        value={value}
        multiple
        fullWidth
        size="small"
        sx={{ maxWidth: '109px' }}
        onChange={event => handleChange(event)}
      >
        {['malicious', 'highly_suspicious', 'suspicious', 'info', 'safe'].map(name => (
          <MenuItem key={name} value={name} sx={{ '&>span': { width: '100%' } }}>
            <Verdict verdict={name as any} fullWidth pointer />
          </MenuItem>
        ))}
      </Select>
    </GridTableCell>
  );
});

export const ArchivedTagSection = React.memo(WrappedArchivedTagSection);
export default ArchivedTagSection;
