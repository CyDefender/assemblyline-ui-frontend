import Paper from '@material-ui/core/Paper';
import TableContainer from '@material-ui/core/TableContainer';
import { AlertTitle, Skeleton } from '@material-ui/lab';
import useALContext from 'components/hooks/useALContext';
import { Statistics } from 'components/routes/manage/heuristic_detail';
import Classification from 'components/visual/Classification';
import 'moment/locale/fr';
import React from 'react';
import { useTranslation } from 'react-i18next';
import Moment from 'react-moment';
import { Link } from 'react-router-dom';
import {
  DivTable,
  DivTableBody,
  DivTableCell,
  DivTableHead,
  DivTableRow,
  LinkRow,
  SortableHeaderCell
} from '../DivTable';
import InformativeAlert from '../InformativeAlert';

export type HeuristicResult = {
  attack_id: string[];
  classification: string;
  description: string;
  filetype: string;
  heur_id: string;
  id: string;
  max_score: number;
  name: string;
  score: number;
  stats: Statistics;
};

type SearchResults = {
  items: HeuristicResult[];
  rows: number;
  offset: number;
  total: number;
};

type HeuristicsTableProps = {
  heuristicResults: SearchResults;
  setHeuristicID?: (id: string) => void;
  allowSort?: boolean;
};

const WrappedHeuristicsTable: React.FC<HeuristicsTableProps> = ({
  heuristicResults,
  setHeuristicID = null,
  allowSort = true
}) => {
  const { t, i18n } = useTranslation(['search']);
  const { c12nDef } = useALContext();

  return heuristicResults ? (
    heuristicResults.total !== 0 ? (
      <TableContainer component={Paper}>
        <DivTable>
          <DivTableHead>
            <DivTableRow>
              <SortableHeaderCell sortField="heur_id" allowSort={allowSort}>
                {t('header.id')}
              </SortableHeaderCell>
              <SortableHeaderCell sortField="name" allowSort={allowSort}>
                {t('header.name')}
              </SortableHeaderCell>
              <SortableHeaderCell sortField="filetype" allowSort={allowSort}>
                {t('header.filetype')}
              </SortableHeaderCell>
              <SortableHeaderCell sortField="score" allowSort={allowSort}>
                {t('header.score')}
              </SortableHeaderCell>
              <SortableHeaderCell sortField="stats.count" allowSort={allowSort}>
                {t('header.hit_count')}
              </SortableHeaderCell>
              <SortableHeaderCell sortField="stats.last_hit" allowSort={allowSort}>
                {t('header.last_hit')}
              </SortableHeaderCell>
              {c12nDef.enforce && (
                <SortableHeaderCell sortField="classification" allowSort={allowSort}>
                  {t('header.classification')}
                </SortableHeaderCell>
              )}
            </DivTableRow>
          </DivTableHead>
          <DivTableBody>
            {heuristicResults.items.map(heuristic => (
              <LinkRow
                key={heuristic.heur_id}
                component={Link}
                to={`/manage/heuristic/${heuristic.heur_id}`}
                onClick={event => {
                  if (setHeuristicID) {
                    event.preventDefault();
                    setHeuristicID(heuristic.heur_id);
                  }
                }}
                hover
              >
                <DivTableCell>{heuristic.heur_id}</DivTableCell>
                <DivTableCell>{heuristic.name}</DivTableCell>
                <DivTableCell>{heuristic.filetype}</DivTableCell>
                <DivTableCell>{heuristic.score}</DivTableCell>
                <DivTableCell>{heuristic.stats ? heuristic.stats.count || 0 : 0}</DivTableCell>
                <DivTableCell>
                  {heuristic.stats && heuristic.stats.last_hit ? (
                    <Moment fromNow locale={i18n.language}>
                      {heuristic.stats.last_hit}
                    </Moment>
                  ) : (
                    t('never')
                  )}
                </DivTableCell>
                {c12nDef.enforce && (
                  <DivTableCell>
                    <Classification type="text" size="tiny" c12n={heuristic.classification} format="short" />
                  </DivTableCell>
                )}
              </LinkRow>
            ))}
          </DivTableBody>
        </DivTable>
      </TableContainer>
    ) : (
      <div style={{ width: '100%' }}>
        <InformativeAlert>
          <AlertTitle>{t('no_heuristics_title')}</AlertTitle>
          {t('no_results_desc')}
        </InformativeAlert>
      </div>
    )
  ) : (
    <Skeleton variant="rect" style={{ height: '6rem', borderRadius: '4px' }} />
  );
};

const HeuristicsTable = React.memo(WrappedHeuristicsTable);
export default HeuristicsTable;
