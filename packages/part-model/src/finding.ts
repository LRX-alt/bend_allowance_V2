export type Severity = 'info' | 'warning' | 'error';

export interface Finding {
  severity: Severity;
  code: string;
  message: string;
  geometryRefs?: string[];
  suggestedAction?: { kind: string; params?: Record<string, unknown>; label: string };
  data?: Record<string, number | string>;
}

export function finding(
  severity: Severity,
  code: string,
  message: string,
  extra?: Partial<Pick<Finding, 'geometryRefs' | 'suggestedAction' | 'data'>>
): Finding {
  return { severity, code, message, ...extra };
}
