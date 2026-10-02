import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminAuth from 'firebase-admin/auth';
import { setUserAdminClaim } from './setAdminClaim';

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(),
}));

describe('setUserAdminClaim', () => {
  let mockAuth;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = {
      getUserByEmail: vi.fn(),
      getUser: vi.fn(),
      setCustomUserClaims: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(adminAuth.getAuth).mockReturnValue(mockAuth);
  });

  it('sets admin custom claim by email', async () => {
    mockAuth.getUserByEmail.mockResolvedValue({
      uid: 'uid-123',
      email: 'admin@example.com',
      customClaims: {},
    });

    const result = await setUserAdminClaim('admin@example.com');

    expect(mockAuth.getUserByEmail).toHaveBeenCalledWith('admin@example.com');
    expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith('uid-123', {
      admin: true,
    });
    expect(result).toEqual({
      uid: 'uid-123',
      email: 'admin@example.com',
      claims: { admin: true },
      isAdmin: true,
    });
  });

  it('sets admin custom claim by uid', async () => {
    mockAuth.getUser.mockResolvedValue({
      uid: 'uid-456',
      email: 'user@example.com',
      customClaims: { existingRole: 'editor' },
    });

    const result = await setUserAdminClaim('uid-456');

    expect(mockAuth.getUser).toHaveBeenCalledWith('uid-456');
    expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith('uid-456', {
      existingRole: 'editor',
      admin: true,
    });
    expect(result.isAdmin).toBe(true);
    expect(result.claims).toEqual({ existingRole: 'editor', admin: true });
  });

  it('revokes admin claim when revoke is true', async () => {
    mockAuth.getUserByEmail.mockResolvedValue({
      uid: 'uid-789',
      email: 'revoked@example.com',
      customClaims: { admin: true, team: 'alpha' },
    });

    const result = await setUserAdminClaim('revoked@example.com', {
      revoke: true,
    });

    expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith('uid-789', {
      team: 'alpha',
    });
    expect(result.isAdmin).toBe(false);
    expect(result.claims).toEqual({ team: 'alpha' });
  });

  it('throws an error when identifier is missing or empty', async () => {
    await expect(setUserAdminClaim('')).rejects.toThrow(
      'Укажите email или UID пользователя.'
    );
  });
});
