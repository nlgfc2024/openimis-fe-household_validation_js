import React, { useMemo } from 'react';
import {
  Autocomplete,
  useGraphqlQuery,
} from '@openimis/fe-core';

const hotspotLabel = (hotspot) => (
  hotspot ? [hotspot.code, hotspot.name].filter(Boolean).join(' - ') : ''
);

function HotspotPicker({
  label,
  microCatchment,
  onChange,
  readOnly,
  required,
  tas = [],
  value,
}) {
  const { data, isLoading, error } = useGraphqlQuery(
    `
      query HouseholdValidationHotspotPicker($microCatchmentUuid: String) {
        hotspots(
          first: 100
          microCatchment_Uuid: $microCatchmentUuid
          orderBy: ["name"]
        ) {
          edges {
            node {
              id
              uuid
              code
              name
              villages {
                id
                uuid
                code
                name
                parent {
                  id
                  uuid
                  code
                  name
                  parent {
                    id
                    uuid
                    code
                    name
                  }
                }
              }
            }
          }
        }
      }
    `,
    {
      microCatchmentUuid: microCatchment?.uuid,
    },
    { skip: !microCatchment?.uuid || !tas.length },
  );

  const options = useMemo(() => {
    const taUuids = new Set(tas.map((ta) => ta?.uuid).filter(Boolean));
    return (data?.hotspots?.edges ?? [])
      .map((edge) => edge.node)
      .filter((hotspot) => hotspot.villages?.some(
        (village) => taUuids.has(village?.parent?.parent?.uuid),
      ));
  }, [data, tas]);

  return (
    <Autocomplete
      required={required}
      label={label}
      error={error}
      readOnly={readOnly || !microCatchment?.uuid || !tas.length}
      options={options}
      isLoading={isLoading}
      value={value}
      getOptionLabel={hotspotLabel}
      onChange={(option) => onChange(option)}
      onInputChange={() => {}}
    />
  );
}

export default HotspotPicker;
