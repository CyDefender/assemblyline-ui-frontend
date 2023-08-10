import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';
import { AlertTitle, Skeleton, Tooltip, useTheme } from '@mui/material';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import { CustomUser } from 'components/hooks/useMyUser';
import CustomChip from 'components/visual/CustomChip';
import {
  DivTable,
  DivTableBody,
  DivTableCell,
  DivTableHead,
  DivTableRow,
  LinkRow,
  SortableHeaderCell
} from 'components/visual/DivTable';
import 'moment/locale/fr';
import React from 'react';
import { useTranslation } from 'react-i18next';
import Moment from 'react-moment';
import { Link } from 'react-router-dom';
import FileDownloader from '../FileDownloader';
import InformativeAlert from '../InformativeAlert';

export type ArchivedFileResult = {
  archive_ts: string;
  ascii: string;
  classification: string;
  entropy: number;
  expiry_ts: string | null;
  hex: string;
  id: string;
  labels: string[];
  label_categories?: {
    info: string[];
    safe: string[];
    suspicious: string[];
    malicious: string[];
  };
  magic: string;
  md5: string;
  mime: string;
  seen: {
    count: number;
    first: string;
    last: string;
  };
  sha1: string;
  sha256: string;
  size: number;
  ssdeep: string;
  type: string;
};

type SearchResults = {
  items: ArchivedFileResult[];
  rows: number;
  offset: number;
  total: number;
};

type ArchivesTableProps = {
  fileResults: SearchResults;
  allowSort?: boolean;
  setFileID?: (id: string) => void;
  onLabelClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, label: string) => void;
};

const LABELS_COLOR_MAP = {
  info: 'default',
  technique: 'secondary',
  attribution: 'primary'
};

const WrappedArchivesTable: React.FC<ArchivesTableProps> = ({
  fileResults,
  allowSort = true,
  setFileID = null,
  onLabelClick = null
}) => {
  const { t, i18n } = useTranslation(['archive']);
  const theme = useTheme();
  const { user: currentUser } = useAppUser<CustomUser>();

  return fileResults ? (
    fileResults.total !== 0 ? (
      <TableContainer component={Paper}>
        <DivTable>
          <DivTableHead>
            <DivTableRow>
              <SortableHeaderCell children={t('header.seen.last')} sortField="seen.last" allowSort={allowSort} />
              <SortableHeaderCell children={t('header.sha256')} sortField="sha256" allowSort={allowSort} />
              <SortableHeaderCell children={t('header.type')} sortField="type" allowSort={allowSort} />
              <DivTableCell children={t('header.labels')} />
              <DivTableCell children={null} style={{ textAlign: 'center' }} />
            </DivTableRow>
          </DivTableHead>
          <DivTableBody>
            {fileResults.items.map((file, i) => (
              <LinkRow
                key={`${file.id}-${i}`}
                component={Link}
                to={`/archive/${file.id}`}
                onClick={event => {
                  if (setFileID) {
                    event.preventDefault();
                    setFileID(file.id);
                  }
                }}
                hover
                style={{ textDecoration: 'none' }}
              >
                <DivTableCell>
                  <Tooltip title={file.seen.last}>
                    <>
                      <Moment fromNow locale={i18n.language} children={file.seen.last} />
                    </>
                  </Tooltip>
                </DivTableCell>
                <DivTableCell>
                  {!('sha256' in file) ? null : (
                    <div
                      children={file.sha256}
                      style={{
                        // width: upLG ? '100%' : '10vw',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    />
                  )}
                </DivTableCell>
                <DivTableCell children={'type' in file ? file.type : null} />
                <DivTableCell
                  children={
                    <div style={{ display: 'flex', gap: theme.spacing(1), flexWrap: 'wrap' }}>
                      {['attribution', 'technique', 'info'].map(
                        (category, j) =>
                          file.label_categories &&
                          category in file.label_categories &&
                          file.label_categories[category].map((label, k) => (
                            <CustomChip
                              key={`${j}-${k}`}
                              wrap
                              variant="outlined"
                              size="tiny"
                              type="rounded"
                              color={category in LABELS_COLOR_MAP ? LABELS_COLOR_MAP[category] : 'primary'}
                              label={label}
                              style={{ height: 'auto', minHeight: '20px' }}
                              onClick={
                                !onLabelClick
                                  ? null
                                  : event => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      onLabelClick(event, label);
                                    }
                              }
                            />
                          ))
                      )}
                    </div>
                  }
                />
                <DivTableCell
                  style={{
                    padding: 'unset',
                    textAlign: 'center',
                    paddingLeft: theme.spacing(1),
                    paddingRight: theme.spacing(1)
                  }}
                >
                  {currentUser.roles.includes('file_download') && 'sha256' in file && (
                    <FileDownloader
                      icon={<GetAppOutlinedIcon fontSize="small" />}
                      link={`/api/v4/file/download/${file.sha256}/?`}
                      size="small"
                      onClick={e => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    />
                  )}
                </DivTableCell>
              </LinkRow>
            ))}
          </DivTableBody>
        </DivTable>
      </TableContainer>
    ) : (
      <div style={{ width: '100%' }}>
        <InformativeAlert>
          <AlertTitle>{t('no_errors_title')}</AlertTitle>
          {t('no_results_desc')}
        </InformativeAlert>
      </div>
    )
  ) : (
    <Skeleton variant="rectangular" style={{ height: '6rem', borderRadius: '4px' }} />
  );
};

const ArchivesTable = React.memo(WrappedArchivesTable);
export default ArchivesTable;
