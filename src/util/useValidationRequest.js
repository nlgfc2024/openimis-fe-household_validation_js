import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { validationRequest } from './individualValidation';

// Dialog closure, filter edits and newer requests invalidate pending responses.
export default function useValidationRequest() {
  const active = useRef(null);
  const [state, setState] = useState({ loading: false, error: null });
  const reset = useCallback(() => {
    active.current?.abort();
    active.current = null;
    setState({ loading: false, error: null });
  }, []);
  useEffect(() => () => active.current?.abort(), []);
  const run = useCallback(async (query, variables, receive) => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setState({ loading: true, error: null });
    try {
      const data = await validationRequest(query, variables, controller.signal);
      if (active.current !== controller || controller.signal.aborted) return;
      receive(data);
      setState({ loading: false, error: null });
    } catch (error) {
      if (active.current !== controller || controller.signal.aborted) return;
      setState({ loading: false, error: error.message });
    }
  }, []);
  return { ...state, run, reset };
}
