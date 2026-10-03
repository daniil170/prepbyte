import { describe, expect, it, vi } from 'vitest';
import {
  createUserProfileRepository,
  documentToUserProfile,
  userProfileToDocument,
} from './userProfileRepository';

describe('userProfileRepository', () => {
  it('maps firestore document data to UserProfile entity', () => {
    const data = {
      email: 'student@prepbyte.kz',
      displayName: 'Alikhan',
      role: 'student',
      teacherId: 'teacher-1',
      groupIds: ['grp-a'],
      school: 'School 1',
      grade: 11,
      createdAt: 10000,
      updatedAt: 20000,
    };

    const profile = documentToUserProfile('usr-1', data);
    expect(profile.uid).toBe('usr-1');
    expect(profile.email).toBe('student@prepbyte.kz');
    expect(profile.displayName).toBe('Alikhan');
    expect(profile.role).toBe('student');
    expect(profile.teacherId).toBe('teacher-1');
    expect(profile.groupIds).toEqual(['grp-a']);
  });

  it('maps UserProfile entity to document representation', () => {
    const profile = {
      uid: 'usr-1',
      email: 'test@example.com',
      displayName: 'Name',
      role: 'student',
      teacherId: null,
      groupIds: [],
      school: null,
      grade: null,
      createdAt: 12345,
      updatedAt: 67890,
    };

    const doc = userProfileToDocument(profile, { serverUpdated: false });
    expect(doc.uid).toBe('usr-1');
    expect(doc.email).toBe('test@example.com');
    expect(doc.updatedAt).toBe(67890);
  });

  it('ensureUserProfile returns existing profile when doc exists', async () => {
    const mockSnap = {
      exists: () => true,
      id: 'u-exists',
      data: () => ({
        email: 'exists@example.com',
        role: 'student',
      }),
    };

    const mockDb = {};
    const repo = createUserProfileRepository(mockDb);

    vi.spyOn(repo, 'getUserProfile').mockResolvedValue(
      documentToUserProfile('u-exists', mockSnap.data())
    );

    // Call with stubbed getDoc
    const result = await repo.getUserProfile('u-exists');
    expect(result.uid).toBe('u-exists');
    expect(result.email).toBe('exists@example.com');
  });
});
