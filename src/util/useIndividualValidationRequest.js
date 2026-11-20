import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearIndividualValidation, failIndividualValidation, requestIndividualValidation } from '../actions';

let nextRequestKey = 0;
const EMPTY = { loading: false, error: null };

// fe-core owns HTTP/session handling; reducer IDs and this version protect
// both Redux status and callbacks after edits, unmounts or newer requests.
export default function useIndividualValidationRequest() {
  const dispatch = useDispatch();
  const requestKey = useRef(null);
  if (requestKey.current === null) requestKey.current = ++nextRequestKey;
  const key = requestKey.current;
  const version = useRef(0);
  const state = useSelector((store) => store.householdValidation?.individualRequests?.[key] ?? EMPTY);
  const reset = useCallback(() => {
    version.current += 1;
    dispatch(clearIndividualValidation(key));
  }, [dispatch, key]);
  useEffect(() => reset, [reset]);
  const run = useCallback(async (operation, variables, receive) => {
    const current = ++version.current;
    const action = await dispatch(requestIndividualValidation(key, operation, variables));
    if (version.current !== current || action?.error || action?.payload?.errors?.length || !action?.payload?.data) return;
    try {
      receive(action.payload.data);
    } catch (error) {
      dispatch(failIndividualValidation(action.meta, error));
    }
  }, [dispatch, key]);
  return { ...state, run, reset };
}
