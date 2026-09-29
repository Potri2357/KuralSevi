import fs from 'fs';
import path from 'path';

export type UserRole = 'admin' | 'district_officer' | 'panchayat_kiosk';

export interface ProvisionedUser {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: UserRole;
  district?: string | null;
  panchayat?: string | null;
  is_active: boolean;
  created_at: string;
}

const REGISTRY_PATH = path.join(process.cwd(), 'src', 'data', 'provisioned-users.json');

function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getProvisionedUsers(): ProvisionedUser[] {
  try {
    ensureDirectoryExists(REGISTRY_PATH);
    if (!fs.existsSync(REGISTRY_PATH)) {
      // Seed with initial default admin if empty
      const defaultUsers: ProvisionedUser[] = [
        {
          id: 'admin-default-001',
          email: 'admin@kuralsevi.gov.in',
          password: 'AdminPassword123!',
          full_name: 'State Welfare Administrator',
          role: 'admin',
          district: 'Chennai HQ',
          panchayat: null,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];
      fs.writeFileSync(REGISTRY_PATH, JSON.stringify(defaultUsers, null, 2), 'utf-8');
      return defaultUsers;
    }
    const data = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    return JSON.parse(data) as ProvisionedUser[];
  } catch (err) {
    console.error('Error reading provisioned users:', err);
    return [];
  }
}

export function saveProvisionedUser(user: ProvisionedUser): void {
  try {
    ensureDirectoryExists(REGISTRY_PATH);
    const users = getProvisionedUsers();
    const existingIndex = users.findIndex(
      (u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
    );

    if (existingIndex >= 0) {
      users[existingIndex] = {
        ...users[existingIndex],
        ...user,
      };
    } else {
      users.unshift(user);
    }

    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving provisioned user:', err);
  }
}

export function updateProvisionedUser(
  id: string,
  updates: Partial<Omit<ProvisionedUser, 'id' | 'created_at'>>
): boolean {
  try {
    const users = getProvisionedUsers();
    const user = users.find((u) => u.id === id);
    if (!user) return false;

    Object.assign(user, updates);
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error updating provisioned user:', err);
    return false;
  }
}

export function findProvisionedUserByEmail(email: string): ProvisionedUser | undefined {
  const users = getProvisionedUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findProvisionedUserById(id: string): ProvisionedUser | undefined {
  const users = getProvisionedUsers();
  return users.find((u) => u.id === id);
}
