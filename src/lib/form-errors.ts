import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { errorMessage, isApiError } from '@/api/client/api-error';

/**
 * Puts a Laravel 422 `{ errors: { field: [msg] } }` response onto React Hook
 * Form fields. `fieldMap` renames API fields to form fields (`startsAt` ->
 * `slot`). Anything unmapped, and non-422 errors, go to `root.server`.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMap: Readonly<Record<string, Path<T>>>,
): void {
  if (!isApiError(error) || error.kind !== 'validation') {
    setError('root.server', { type: 'server', message: errorMessage(error) });
    return;
  }
  let unmapped: string | null = null;
  for (const [apiField, messages] of Object.entries(error.fieldErrors)) {
    const field = fieldMap[apiField];
    const message = messages[0] ?? error.message;
    if (field) setError(field, { type: 'server', message }, { shouldFocus: true });
    else unmapped ??= message;
  }
  if (unmapped) setError('root.server', { type: 'server', message: unmapped });
}
