import { describe, it, expect, vi } from 'vitest';

const mockDeleteUser = vi.fn().mockResolvedValue();
const mockCreateUser = vi.fn().mockResolvedValue();
const mockSetCustomUserClaims = vi.fn().mockResolvedValue();
const mockDocSet = vi.fn().mockResolvedValue();

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    deleteUser: mockDeleteUser,
    createUser: mockCreateUser,
    setCustomUserClaims: mockSetCustomUserClaims,
  })),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: mockDocSet,
      })),
    })),
  })),
}));

describe('seedEmulator module', () => {
  it('executes emulator seeding safely and sets auth users & firestore docs', async () => {
    const { seedEmulator } = await import('./seedEmulator');
    await expect(seedEmulator()).resolves.not.toThrow();

    expect(mockCreateUser).toHaveBeenCalledTimes(4);
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith('admin_user_id', { admin: true });
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith('teacher_user_id', { teacher: true });
    expect(mockDocSet).toHaveBeenCalled();
  });
});
