// Disable due to core architecture
/* eslint-disable camelcase */
/* eslint-disable import/prefer-default-export */
import flatten from 'flat';
import { FormattedMessage } from '@openimis/fe-core';
import React from 'react';
import ListAltIcon from '@material-ui/icons/ListAlt';

import messages_en from './translations/en.json';
import reducer from './reducer';
import HouseholdValidationPage from './pages/HouseholdValidationPage';
import {
  HOUSEHOLD_VALIDATION_MODULE_NAME,
  RIGHT_HOUSEHOLD_VALIDATION_SEARCH,
} from './constants';

const ROUTE_GENERATE_VALIDATION_LIST = 'household-validation';

const DEFAULT_CONFIG = {
  translations: [{ key: 'en', messages: flatten(messages_en) }],
  reducers: [{ key: HOUSEHOLD_VALIDATION_MODULE_NAME, reducer }],
  'core.Router': [
    { path: ROUTE_GENERATE_VALIDATION_LIST, component: HouseholdValidationPage },
  ],
  'socialProtection.MainMenu': [
    {
      text: <FormattedMessage module={HOUSEHOLD_VALIDATION_MODULE_NAME} id="menu.generateValidationList" />,
      icon: <ListAltIcon />,
      route: `/${ROUTE_GENERATE_VALIDATION_LIST}`,
      filter: (rights) => rights.includes(RIGHT_HOUSEHOLD_VALIDATION_SEARCH),
      id: `${HOUSEHOLD_VALIDATION_MODULE_NAME}.generateValidationList`,
    },
  ],
  refs: [
    { key: `${HOUSEHOLD_VALIDATION_MODULE_NAME}.route.generateValidationList`, ref: ROUTE_GENERATE_VALIDATION_LIST },
  ],
};

export const HouseholdValidationModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });
