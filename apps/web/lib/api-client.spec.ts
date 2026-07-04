import { describe, expect, it, beforeEach } from 'vitest';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './api-client';

describe('token storage', () => {
  beforeEach(() => {
    clearTokens();
  });

  it('returns null when no tokens are stored', () => {
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('stores and retrieves tokens', () => {
    setTokens('access-123', 'refresh-456');
    expect(getAccessToken()).toBe('access-123');
    expect(getRefreshToken()).toBe('refresh-456');
  });

  it('clears tokens', () => {
    setTokens('access-123', 'refresh-456');
    clearTokens();
    expect(getAccessToken()).toBeNull();
  });
});
