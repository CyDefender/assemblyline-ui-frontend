import { AppBar, Avatar, Divider, List, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import AppsIcon from '@mui/icons-material/Apps';
import Skeleton from '@mui/material/Skeleton';
import useAppLayout from 'commons/components/hooks/useAppLayout';
import { LeftNavElement } from 'commons/components/layout/leftnav/LeftNavDrawer';
import { useStyles as userProfileStyles } from 'commons/components/layout/topnav/UserProfile';
import React from 'react';
import useAppContext from '../hooks/useAppContext';

/**
 * MaterialUI dynamic style classes for layout skeleton component.
 */
const useStyles = makeStyles(theme => ({
  container: {
    position: 'fixed',
    zIndex: theme.zIndex.appBar + 1000,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  toplayout: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  leftlayout: {
    height: '100%',
    display: 'flex',
    flexDirection: 'row'
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    backgroundColor: theme.palette.background.default
  },
  contentLeft: {
    border: theme.palette.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
    borderTopColor: 'transparent',
    backgroundColor: theme.palette.background.paper,
    marginRight: 5,
    flex: '0 0 auto',
    [theme.breakpoints.down('lg')]: {
      display: 'none'
    }
  },
  contentRight: {
    flex: '1 1 auto'
  },
  title: {
    fontSize: '1.5rem',
    letterSpacing: '-1'
  },
  quickSearch: {
    padding: theme.spacing(2),
    [theme.breakpoints.down('lg')]: {
      display: 'none'
    }
  },
  breadcrumbs: {
    height: theme.spacing(4),
    [theme.breakpoints.down('lg')]: {
      display: 'none'
    }
  }
}));

/**
 * Default Skeleton component that will render either [TopLayoutSkeleton] or [SideLayoutSkeleton] based on [useAppLayout::currentLayout].
 */
const LayoutSkeleton: React.FC = () => {
  const { currentLayout } = useAppLayout();
  return currentLayout === 'top' ? <TopLayoutSkeleton /> : <SideLayoutSkeleton />;
};

/**
 * A Skeleton for the side layout.
 */
const SideLayoutSkeleton = () => {
  const theme = useTheme();
  const classes = useStyles();
  const { getAppbarStyles } = useAppContext();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const userProfileClasses = userProfileStyles();
  const { layoutProps, showQuickSearch: _showQuickSearch, breadcrumbsEnabled, drawerState } = useAppLayout();
  const showBreadcrumbs = breadcrumbsEnabled;
  const showTopBarBreadcrumbs = showBreadcrumbs && !isSm;
  const showQuicksearch = _showQuickSearch;
  const sp1 = theme.spacing(1);
  const sp2 = theme.spacing(2);
  const { backgroundColor } = getAppbarStyles('side');

  return (
    <div className={classes.container}>
      <div className={classes.leftlayout}>
        <div className={classes.content}>
          <div className={classes.contentLeft} style={{ width: drawerState ? 240 : 57 }}>
            <Toolbar disableGutters>
              <ButtonSkeleton
                withText={drawerState}
                style={{ paddingTop: sp1, paddingBottom: sp1, paddingLeft: sp2, paddingRight: sp2, flexGrow: 1 }}
              />
            </Toolbar>
            <Divider />
            <List disablePadding>
              <LeftNavElementsSkeleton elements={layoutProps.leftnav.elements} withText={drawerState} />
              <Divider />
              <ButtonSkeleton
                withText={drawerState}
                style={{ paddingTop: sp1, paddingBottom: sp1, paddingLeft: sp2, paddingRight: sp2 }}
              />
            </List>
          </div>
          <div className={classes.contentRight}>
            <AppBar position="relative" elevation={0} style={{ backgroundColor }}>
              <Toolbar disableGutters style={{ paddingRight: sp2, paddingLeft: !isXs ? sp2 : null }}>
                {isXs && (
                  <ButtonSkeleton
                    withText={drawerState}
                    style={{
                      paddingTop: sp1,
                      paddingBottom: sp1,
                      paddingLeft: sp2,
                      paddingRight: sp2,
                      flexGrow: 1
                    }}
                  />
                )}
                {showTopBarBreadcrumbs && (
                  <Skeleton variant="text" animation="wave" width={100} className={classes.breadcrumbs} />
                )}
                {showTopBarBreadcrumbs && <div style={{ flexGrow: 1 }} />}
                {showQuicksearch && (
                  <Skeleton
                    variant="text"
                    animation="wave"
                    width={showTopBarBreadcrumbs ? 300 : 'auto'}
                    style={{ flexGrow: !showTopBarBreadcrumbs ? 1 : 0 }}
                    className={classes.quickSearch}
                  />
                )}
                <ButtonSkeleton
                  withText={false}
                  style={{
                    paddingTop: sp1,
                    paddingBottom: sp1,
                    paddingLeft: sp2,
                    paddingRight: sp2,
                    marginLeft: sp1,
                    marginRight: sp1
                  }}
                />
                <Skeleton animation="wave" variant="circular">
                  <Avatar className={userProfileClasses.iconButton} />
                </Skeleton>
              </Toolbar>
            </AppBar>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * A Skeleton for the top layout.
 */
const TopLayoutSkeleton = () => {
  const theme = useTheme();
  const classes = useStyles();
  const { getAppbarStyles } = useAppContext();
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const userProfileClasses = userProfileStyles();
  const { layoutProps, showQuickSearch: _showQuickSearch, breadcrumbsEnabled, drawerState } = useAppLayout();
  const showBreadcrumbs = breadcrumbsEnabled;
  const showTopBarBreadcrumbs = showBreadcrumbs && !isSm;
  const showQuicksearch = _showQuickSearch;
  const sp1 = theme.spacing(1);
  const sp2 = theme.spacing(2);
  const sp3 = theme.spacing(3);
  const sp4 = theme.spacing(4);
  const { elevation, backgroundColor } = getAppbarStyles('top');

  return (
    <div className={classes.container}>
      <div className={classes.toplayout}>
        <AppBar position="relative" elevation={elevation} style={{ backgroundColor }}>
          <Toolbar style={{ paddingRight: sp2 }} disableGutters>
            <ButtonSkeleton
              withText={false}
              style={{ paddingTop: sp1, paddingBottom: sp1, paddingLeft: sp2, paddingRight: sp4 }}
            />
            <Skeleton variant="text" animation="wave" style={{ marginRight: sp3 }}>
              <div style={{ fontSize: '1.5rem', letterSpacing: '-1px' }}>{layoutProps.appName}</div>
            </Skeleton>
            {showTopBarBreadcrumbs && (
              <Skeleton variant="text" animation="wave" width={100} className={classes.breadcrumbs} />
            )}
            {showTopBarBreadcrumbs && !isSm && <div style={{ flexGrow: 1 }} />}
            {showQuicksearch && (
              <Skeleton
                variant="text"
                animation="wave"
                width={showTopBarBreadcrumbs ? 300 : 'auto'}
                style={{ flexGrow: !showTopBarBreadcrumbs ? 1 : 0 }}
                className={classes.quickSearch}
              />
            )}
            <ButtonSkeleton
              withText={false}
              style={{
                paddingTop: sp1,
                paddingBottom: sp1,
                paddingLeft: sp2,
                paddingRight: sp2,
                marginLeft: sp1,
                marginRight: sp1
              }}
            />
            <Skeleton animation="wave" variant="circular">
              <Avatar className={userProfileClasses.iconButton} />
            </Skeleton>
          </Toolbar>
        </AppBar>
        <div className={classes.content}>
          <div className={classes.contentLeft} style={{ width: drawerState ? 240 : 57 }}>
            <List disablePadding>
              <LeftNavElementsSkeleton elements={layoutProps.leftnav.elements} withText={drawerState} />
              <Divider />
              <ButtonSkeleton
                withText={drawerState}
                style={{ paddingTop: sp1, paddingBottom: sp1, paddingLeft: sp2, paddingRight: sp2 }}
              />
            </List>
          </div>
          <div className={classes.contentRight} />
        </div>
      </div>
    </div>
  );
};

/**
 * Utility component to render the  skeleton of the left navigation menu elements.
 *
 * The
 *
 * The specified properties are simply passed down to each child [ButtonSkeleton] component.
 *
 * @param props
 */
interface LeftNavElementsSkeletonProps {
  // eslint-disable-next-line react/require-default-props
  withText?: boolean;
  elements: LeftNavElement[];
}
const LeftNavElementsSkeleton = ({ elements, withText }: LeftNavElementsSkeletonProps) => {
  const theme = useTheme();
  return (
    <>
      {elements.map((element, i) => {
        if (element.type === 'divider') {
          return <Divider key={`leftnav-sklt-divider-${i}`} />;
        }
        return (
          <ButtonSkeleton
            withText={withText}
            style={{
              paddingTop: theme.spacing(1),
              paddingBottom: theme.spacing(1),
              paddingLeft: theme.spacing(2),
              paddingRight: theme.spacing(2)
            }}
            key={`leftnav-sklt-${element.element.id}`}
          />
        );
      })}
    </>
  );
};

interface ButtonSkeletonProps {
  style: { [styleAttr: string]: any };
  // eslint-disable-next-line react/require-default-props
  withText?: boolean;
  [propName: string]: any;
}
const ButtonSkeleton = ({ style, withText, ...boxProps }: ButtonSkeletonProps) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));

  return (
    <div style={{ ...style, height: 48, display: 'flex', flexDirection: 'row' }} {...boxProps}>
      <Skeleton variant="text" animation="wave">
        <AppsIcon />
      </Skeleton>
      {withText && (
        <Skeleton
          variant="text"
          animation="wave"
          style={{ flexGrow: 1, marginLeft: isXs ? theme.spacing(2) : theme.spacing(4) }}
        />
      )}
    </div>
  );
};

// Default exported component
export default LayoutSkeleton;
