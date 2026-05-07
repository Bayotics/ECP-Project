/**
 * Consolidated mock seed data for local development and Storybook.
 * Import individual datasets from their own files for production use.
 */

import { mockUsers } from "./users";

export interface Project {
  id: string;
  title: string;
  description: string;
  lga: string;
  status: "active" | "completed" | "pending";
  memberCount: number;
  createdAt: string;
}

export const mockProjects: Project[] = [
  {
    id: "prj_001",
    title: "Clean Lagos Initiative",
    description: "Community-led waste management and beautification project.",
    lga: "Eti-Osa",
    status: "active",
    memberCount: 48,
    createdAt: "2025-02-01",
  },
  {
    id: "prj_002",
    title: "Digital Skills for All",
    description: "Free coding and digital literacy bootcamp for youth in Alimosho.",
    lga: "Alimosho",
    status: "active",
    memberCount: 120,
    createdAt: "2025-01-10",
  },
  {
    id: "prj_003",
    title: "Ward 5 Road Advocacy",
    description: "Petition and monitoring campaign for road repairs in Surulere Ward 5.",
    lga: "Surulere",
    status: "pending",
    memberCount: 22,
    createdAt: "2025-04-18",
  },
  {
    id: "prj_004",
    title: "Ikorodu Youth Employment Hub",
    description:
      "Connecting unemployed youth with skill acquisition and job placement.",
    lga: "Ikorodu",
    status: "completed",
    memberCount: 300,
    createdAt: "2024-06-01",
  },
];

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  type: "town-hall" | "workshop" | "volunteer" | "meetup";
}

export const mockEvents: Event[] = [
  {
    id: "evt_001",
    title: "Lagos Community Town Hall",
    date: "2026-05-10",
    location: "Tafawa Balewa Square, Lagos Island",
    type: "town-hall",
  },
  {
    id: "evt_002",
    title: "Civic Tech Volunteer Day",
    date: "2026-05-15",
    location: "Co-Creation Hub, Yaba",
    type: "volunteer",
  },
  {
    id: "evt_003",
    title: "Data Journalism Workshop",
    date: "2026-05-22",
    location: "Online (Zoom)",
    type: "workshop",
  },
];

/** All seed data bundled */
const seed = {
  users: mockUsers,
  projects: mockProjects,
  events: mockEvents,
};

export default seed;
