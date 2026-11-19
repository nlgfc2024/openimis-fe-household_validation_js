import { useEffect, useState } from 'react';
import useValidationRequest from './useValidationRequest';
import { PROGRAMMES_QUERY } from './individualValidation';

export default function useValidationProgrammes(enabled) {
  const [programmes, setProgrammes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const {
    run, reset, loading, error,
  } = useValidationRequest();
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
  }, [enabled, run, reset]);
  return {
    programmes, loaded, loading, error,
  };
}
