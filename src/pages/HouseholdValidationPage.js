import React, { useState } from 'react';
import { connect } from 'react-redux';
import {
  Form,
  useHistory,
} from '@openimis/fe-core';
import {
  RIGHT_HOUSEHOLD_VALIDATION_SEARCH,
  HOUSEHOLD_VALIDATION_MODULE_NAME,
} from '../constants';
import HouseholdValidationHeadPanel from '../components/HouseholdValidationHeadPanel';

function HouseholdValidationPage({ rights }) {
  const history = useHistory();

  const [filters, setFilters] = useState({});

  const back = () => history.goBack();

  return (
    rights.includes(RIGHT_HOUSEHOLD_VALIDATION_SEARCH) && (
      <Form
        module={HOUSEHOLD_VALIDATION_MODULE_NAME}
        title="generateValidationList.pageTitle"
        back={back}
        edited={filters}
        onEditedChanged={setFilters}
        HeadPanel={HouseholdValidationHeadPanel}
        rights={rights}
        actions={[]}
        canSave={() => false}
        save={null}
        mandatoryFieldsEmpty={null}
      />
    )
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default connect(mapStateToProps)(HouseholdValidationPage);
