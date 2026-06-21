import { useEffect } from 'react';

export function usePrint(skip = false) {
  useEffect(() => {
    if (!skip) window.print();
  }, [skip]);
}
