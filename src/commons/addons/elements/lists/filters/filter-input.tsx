import { InputAdornment, makeStyles, TextField } from '@material-ui/core';
import FilterListIcon from '@material-ui/icons/FilterList';
import Throttler from 'commons/addons/elements/utils/throttler';
import React, { useState } from 'react';
import useFilters from '../hooks/useFilters';
import { FilterField } from './filter-selector';

const useStyles = makeStyles(theme => ({
  filterInput: {
    padding: 0,
    '& svg': {
      transition: theme.transitions.create(['color', 'transform']),
      color: theme.palette.type === 'dark' ? 'hsl(0, 0%, 22%)' : 'hsl(0, 0%, 80%)'
    }
  },
  filterInputFocused: {
    '& svg': {
      color: theme.palette.primary.main
    }
  }
}));

const THROTTLER = new Throttler(100);

interface FilterInputProps {
  filter: FilterField;
  currentFilters: FilterField[];
  filters: FilterField[];
  list: any[];
  onFiltered: (list: any[]) => void;
}

const FilterInput: React.FC<FilterInputProps> = ({ filter, currentFilters, filters, list, onFiltered }) => {
  const classes = useStyles();
  const [value, setValue] = useState<string>('');
  const { applyFilters } = useFilters(filters);

  const onChange = event => {
    filter.value = event.target.value;
    setValue(filter.value);
    THROTTLER.delay(() => {
      onFiltered(applyFilters(list, currentFilters));
    });
  };

  return (
    <TextField
      className={classes.filterInput}
      value={value}
      onChange={onChange}
      label={filter.label}
      InputProps={{
        className: classes.filterInput,
        classes: { focused: classes.filterInputFocused },
        startAdornment: (
          <InputAdornment position="start" disablePointerEvents>
            <FilterListIcon color="inherit" />
          </InputAdornment>
        )
      }}
    />
  );
};

export default FilterInput;
