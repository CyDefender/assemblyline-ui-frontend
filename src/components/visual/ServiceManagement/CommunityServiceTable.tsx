import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import {
  AlertTitle,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Paper,
  Skeleton,
  TableContainer,
  Tooltip
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import 'moment/locale/fr';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { JSONFeedItem } from '.';
import { DivTable, DivTableBody, DivTableCell, DivTableHead, DivTableRow, ExternalLinkRow } from '../DivTable';
import InformativeAlert from '../InformativeAlert';

export type ServiceResult = {
  accepts: string;
  category: string;
  description: string;
  enabled: boolean;
  name: string;
  privileged: boolean;
  rejects: string;
  stage: string;
  version: string;
};

type Props = {
  services: JSONFeedItem[];
  installingServices: string[];
  onInstall: (s: JSONFeedItem[]) => void;
};

const useStyles = makeStyles(() => ({
  center: {
    textAlign: 'center'
  }
}));

const WrappedCommunityServiceTable: React.FC<Props> = ({ services, installingServices, onInstall }: Props) => {
  const { t } = useTranslation(['search']);
  const [serviceToInstall, setServiceToInstall] = useState<JSONFeedItem>(null);
  const classes = useStyles();

  const navigate = useCallback(url => {
    window.open(url, '_blank');
  }, []);

  return services ? (
    services.length !== 0 ? (
      <>
        <Dialog
          open={serviceToInstall !== null}
          onClose={() => setServiceToInstall(null)}
          aria-labelledby="serviceToInstall=title"
          fullWidth
          maxWidth="md"
        >
          <DialogTitle id="serviceToInstall=title">{t('serviceToInstall.title')}</DialogTitle>
          <DialogContent></DialogContent>
          <DialogActions>
            <Button onClick={() => setServiceToInstall(null)} color="secondary">
              {t('serviceToInstall.cancelText')}
            </Button>
            <Button onClick={() => onInstall([serviceToInstall])} color="primary">
              {t('serviceToInstall.acceptText')}
            </Button>
          </DialogActions>
        </Dialog>
        <TableContainer component={Paper}>
          <DivTable>
            <DivTableHead>
              <DivTableRow>
                <DivTableCell>{t('header.name')}</DivTableCell>
                <DivTableCell>{t('header.author')}</DivTableCell>
                <DivTableCell>{t('header.description')}</DivTableCell>
                <DivTableCell />
              </DivTableRow>
            </DivTableHead>
            <DivTableBody>
              {services?.map((service, i) => (
                <ExternalLinkRow key={i + ' - ' + service.title} hover href={service.url}>
                  <DivTableCell>{service.summary}</DivTableCell>
                  <DivTableCell>
                    <Link
                      href={service.authors[0].url}
                      onClick={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        navigate(service.authors[0].url);
                      }}
                      style={{ textDecoration: 'none' }}
                    >
                      {service.authors[0].name}
                    </Link>
                  </DivTableCell>
                  <DivTableCell>{service.content_text}</DivTableCell>
                  <DivTableCell
                    className={classes.center}
                    style={{ whiteSpace: 'nowrap', paddingTop: 0, paddingBottom: 0 }}
                  >
                    <Tooltip
                      title={
                        installingServices?.includes(service?.summary)
                          ? t('installing')
                          : `${service.title} ${t('available')}!`
                      }
                    >
                      <span>
                        <IconButton
                          color="primary"
                          onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            setServiceToInstall(service);
                          }}
                          disabled={installingServices?.includes(service?.summary)}
                          size="large"
                        >
                          <CloudDownloadOutlinedIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </DivTableCell>
                </ExternalLinkRow>
              ))}
            </DivTableBody>
          </DivTable>
        </TableContainer>
      </>
    ) : (
      <div style={{ width: '100%' }}>
        <InformativeAlert>
          <AlertTitle>{t('no_community_services_available_title')}</AlertTitle>
          {t('no_community_services_available_desc')}
        </InformativeAlert>
      </div>
    )
  ) : (
    <Skeleton variant="rectangular" style={{ height: '6rem', borderRadius: '4px' }} />
  );
};

const CommunityServiceTable = React.memo(
  WrappedCommunityServiceTable,
  (prevProps: Readonly<React.PropsWithChildren<Props>>, nextProps: Readonly<React.PropsWithChildren<Props>>) => {
    function arrayEquals(a, b) {
      return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((val, index) => val === b[index]);
    }

    return (
      Object.is(prevProps.onInstall, nextProps.onInstall) &&
      arrayEquals(prevProps.installingServices, nextProps.installingServices) &&
      arrayEquals(
        prevProps.services?.map(s => s?.summary),
        nextProps.services?.map(s => s?.summary)
      )
    );
  }
);

export default CommunityServiceTable;
