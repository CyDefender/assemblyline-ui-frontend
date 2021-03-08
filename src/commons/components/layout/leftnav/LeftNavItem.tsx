import { ListItem, ListItemIcon, ListItemText, Tooltip } from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import useAppLayout from 'commons/components/hooks/useAppLayout';
import useAppUser from 'commons/components/hooks/useAppUser';
import { LeftNavItemProps } from 'commons/components/layout/leftnav/LeftNavDrawer';
import React from 'react';
import { Link } from 'react-router-dom';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    nested: {
      paddingLeft: theme.spacing(4)
    }
  })
);

const LeftNavItem: React.FC<LeftNavItemProps> = props => {
  const classes = useStyles();
  const { drawerState, hideNestedIcons, toggleDrawer } = useAppLayout();
  const { text, icon, nested, route, userPropValidators } = props;
  const { validateProps } = useAppUser();

  const onCloseDrawerIfOpen = () => {
    if (isWidthDown('sm', props.width) && drawerState) {
      setTimeout(toggleDrawer, 150);
    }
  };

  const item = (
    <ListItem
      button
      component={route ? Link : null}
      to={route}
      dense={!!nested}
      className={nested ? classes.nested : null}
      key={text}
      onClick={onCloseDrawerIfOpen}
    >
      {((icon && !nested) || (!hideNestedIcons && icon && nested)) && <ListItemIcon>{icon}</ListItemIcon>}
      <ListItemText primary={text} />
    </ListItem>
  );

  return validateProps(userPropValidators) ? (
    drawerState || nested ? (
      item
    ) : (
      <Tooltip title={text} aria-label={text} placement="right">
        {item}
      </Tooltip>
    )
  ) : null;
};

export default withWidth()(LeftNavItem);
