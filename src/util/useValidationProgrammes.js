import { useCallback, useEffect, useState } from 'react';
import useIndividualValidationRequest from './useIndividualValidationRequest';
import { PROGRAMMES_QUERY } from './individualValidation';

export default function useValidationProgrammes(enabled) {
  const [programmes, setProgrammes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((value) => value + 1), []);
  const {
    run, reset, loading, error,
  } = useIndividualValidationRequest();
  useEffect(() => {
    setProgrammes([]);
    setLoaded(false);
    if (enabled) {
      run(PROGRAMMES_QUERY, {}, (data) => {
        setProgrammes(data.validationProgrammes ?? []);
        setLoaded(true);
      });
    }
    return reset;
  }, [enabled, revision, run, reset]);
  return {
    programmes, loaded, loading, error, retry,
  };
}
