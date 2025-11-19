import type { Timestamp } from "firebase/firestore";
import type { Role, Permission } from "@/lib/auth/roles";

export type BaseDocument = {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Company = BaseDocument & {
  name: string;
  website?: string;
  description?: string;
  location?: string;
  industry?: string;
  status: "active" | "inactive";
  logoUrl?: string;
};

export type Job = BaseDocument & {
  title: string;
  description: string;
  location: string;
  employmentType: "full-time" | "part-time" | "contract" | "internship";
  experienceLevel: "entry" | "mid" | "senior" | "lead";
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  skills: string[];
  companyId: string;
  status: "draft" | "published" | "archived";
  applicationUrl?: string;
  remoteFriendly: boolean;
  postedBy: string;
  publishedAt?: Timestamp;
};

export type AppUser = BaseDocument & {
  email: string;
  displayName: string;
  role: Role;
  companyId?: string;
  lastLoginAt?: Timestamp;
  permissions: Permission[];
  disabled: boolean;
};
