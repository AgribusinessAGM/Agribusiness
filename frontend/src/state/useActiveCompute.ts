import { useMemo } from 'react';
import { compute } from '../engine/compute';
import { useApp } from './store';

export function useActiveCompute() {
  const { active } = useApp();
  const model = active();
  const r = useMemo(() => compute(model.a), [model.a]);
  return { model, a: model.a, r };
}
