import React, { useState } from 'react';
import * as R from 'ramda';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  FiltersVariant, findFilterFromKey,
  isUniqFilter,
} from '../../../../utils/filters/filtersUtils';
import FiltersElement from './FiltersElement';
import ListFilters from './ListFilters';
import DialogFilters from './DialogFilters';

const Filters = ({
  variant,
  disabled,
  size,
  fontSize,
  availableFilterKeys,
  noDirectFilters,
  availableEntityTypes,
  availableRelationshipTypes,
  availableRelationFilterTypes,
  allEntityTypes,
  handleAddFilter,
  handleRemoveFilter,
  handleSwitchFilter,
  searchContext = {},
  type,
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filters, setFilters] = useState({ mode: 'and', filter: [] });
  const [inputValues, setInputValues] = useState<[{ key: string, values: [string | Date], operator: string | undefined }]>([]);
  const [keyword, setKeyword] = useState('');

  const handleOpenFilters = (event) => {
    setOpen(true);
    setAnchorEl(event.currentTarget);
  };
  const handleCloseFilters = () => {
    setOpen(false);
    setAnchorEl(null);
  };
  const defaultHandleAddFilter = handleAddFilter
    || ((key, id, operator = null, event = null) => {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      const filter = findFilterFromKey(filters, key, operator);
      const newValues = (isUniqFilter(key) || !filter) ? [id] : R.uniq([...filter?.values ?? [], id]);
      const newFilterElement = {
        type: 'filter',
        key,
        values: newValues,
        operator: operator ?? 'eq',
        mode: 'or',
      };
      const newBaseFilters = {
        mode: filters.mode,
        filters: filter
          ? [...filters.filters.filter((f) => f.type === 'filter' && (f.key !== key || (operator && f.operator !== operator))), newFilterElement]
          : [...filters.filters, newFilterElement],
      };
      setFilters(newBaseFilters);
    });
  const defaultHandleRemoveFilter = handleRemoveFilter || ((key, operator = null) => {
    const newBaseFilters = {
      mode: filters.mode,
      filters: filters.filters.filter((f) => f.type === 'filter' && (f.key !== key || (operator && f.operator !== operator))),
    };
    setFilters(newBaseFilters);
  });
  const handleSearch = () => {
    handleCloseFilters();
    const urlParams = { filters: JSON.stringify(filters) };
    navigate(
      `/dashboard/search${
        keyword.length > 0 ? `/${keyword}` : ''
      }?${new URLSearchParams(urlParams).toString()}`,
    );
  };
  const handleChangeKeyword = (event) => setKeyword(event.target.value);

  const filterElement = (
    <FiltersElement
      variant={variant}
      keyword={keyword}
      availableFilterKeys={availableFilterKeys}
      searchContext={searchContext}
      handleChangeKeyword={handleChangeKeyword}
      noDirectFilters={noDirectFilters}
      inputValues={inputValues}
      setInputValues={setInputValues}
      defaultHandleAddFilter={defaultHandleAddFilter}
      availableEntityTypes={availableEntityTypes}
      availableRelationshipTypes={availableRelationshipTypes}
      availableRelationFilterTypes={availableRelationFilterTypes}
      allEntityTypes={allEntityTypes}
    />
  );
  if (variant === FiltersVariant.dialog) {
    return (
      <DialogFilters
        handleOpenFilters={handleOpenFilters}
        disabled={disabled}
        size={size}
        fontSize={fontSize}
        open={open}
        filters={filters}
        handleCloseFilters={handleCloseFilters}
        defaultHandleRemoveFilter={defaultHandleRemoveFilter}
        handleSearch={handleSearch}
        filterElement={filterElement}
        type={type}
      />
    );
  }
  return (
    <ListFilters
      size={size}
      fontSize={fontSize}
      handleOpenFilters={handleOpenFilters}
      handleCloseFilters={handleCloseFilters}
      open={open}
      anchorEl={anchorEl}
      noDirectFilters={noDirectFilters}
      availableFilterKeys={availableFilterKeys}
      filterElement={filterElement}
      searchContext={searchContext}
      variant={variant}
      type={type}
      inputValues={inputValues}
      setInputValues={setInputValues}
      defaultHandleAddFilter={defaultHandleAddFilter}
      defaultHandleRemoveFilter={defaultHandleRemoveFilter}
      handleSwitchFilter={handleSwitchFilter}
      availableEntityTypes={availableEntityTypes}
      availableRelationshipTypes={availableRelationshipTypes}
      availableRelationFilterTypes={availableRelationFilterTypes}
      allEntityTypes={allEntityTypes}
    />
  );
};

export default Filters;
