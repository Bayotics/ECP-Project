import { ROLES, type Role } from "@/lib/constants";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  lga: string;
  joinedAt: string;
  isVerified: boolean;
  avatarInitials: string;
}

export const mockUsers: User[] = [
  {
    id: "usr_001",
    name: "Yetunde Adewale",
    email: "yetunde@example.com",
    role: ROLES.MEMBER,
    lga: "Eti-Osa",
    joinedAt: "2025-01-15",
    isVerified: true,
    avatarInitials: "AO",
  },
  {
    id: "usr_002",
    name: "Rotimi Ogunleye",
    email: "rotimi@example.com",
    role: ROLES.ADMIN,
    lga: "Ikeja",
    joinedAt: "2024-11-02",
    isVerified: true,
    avatarInitials: "EO",
  },
  {
    id: "usr_003",
    name: "Fatima Sule",
    email: "fatima@example.com",
    role: ROLES.MEMBER,
    lga: "Alimosho",
    joinedAt: "2025-03-08",
    isVerified: false,
    avatarInitials: "FS",
  },
  {
    id: "usr_004",
    name: "Rotimi Bello",
    email: "rotimi@example.com",
    role: ROLES.MEMBER,
    lga: "Surulere",
    joinedAt: "2025-02-20",
    isVerified: true,
    avatarInitials: "CB",
  },
  {
    id: "usr_005",
    name: "Kemi Adeleke",
    email: "kemi@example.com",
    role: ROLES.ADMIN,
    lga: "Lagos Island",
    joinedAt: "2024-09-14",
    isVerified: true,
    avatarInitials: "NA",
  },
];

export const getMemberUsers = (): User[] =>
  mockUsers.filter((u) => u.role === ROLES.MEMBER);

export const getAdminUsers = (): User[] =>
  mockUsers.filter((u) => u.role === ROLES.ADMIN);

export const getUserById = (id: string): User | undefined =>
  mockUsers.find((u) => u.id === id);

