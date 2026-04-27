export function maskSensitiveData(data: unknown): unknown {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  if (typeof data === 'object' && data !== null) {
    // Check if it's a Date or other special object that shouldn't be spread
    if (data instanceof Date || data.constructor?.name === 'Decimal') {
      return data;
    }

    const masked: Record<string, unknown> = { ...(data as Record<string, unknown>) };
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'creditcard'];

    for (const key of Object.keys(masked)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        masked[key] = '***MASKED***';
      } else if (typeof masked[key] === 'object') {
        masked[key] = maskSensitiveData(masked[key]);
      }
    }
    return masked;
  }

  return data;
}
