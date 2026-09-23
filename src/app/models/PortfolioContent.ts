export interface PortfolioContent {
  site: SiteContent;
  navigation: NavigationItem[];
  hero: HeroContent;
  about: AboutContent;
  skills: SkillsContent;
  experience: { title: string; items: ExperienceItem[] };
  projects: { title: string; subtitle: string; items: ProjectItem[] };
  researchNotes: { title: string; subtitle: string; items: ResearchNote[] };
  contact: ContactContent;
  footer: FooterContent;
}

export interface SiteContent {
  name: string;
  title: string;
  description: string;
  resumeUrl: string;
  profileImage: string;
  logo: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  sectionId: string;
  order: number;
  visible: boolean;
}

export interface HeroContent {
  eyebrow: string;
  name: string;
  headline: string;
  summary: string;
  highlights: string[];
  primaryAction: { label: string; target: string };
  secondaryAction: { label: string; target: string };
}

export interface AboutContent {
  title: string;
  paragraphs: string[];
  image: string;
}

export interface SkillsContent {
  title: string;
  groups: Array<{ id: string; label: string; items: string[] }>;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string | null;
  dateLabel: string;
  companyUrl: string;
  image: string;
  summary: string;
  highlights: string[];
  technologies: string[];
}

export interface ProjectItem {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: 'planned' | 'in-progress' | 'completed';
  featured: boolean;
  visible: boolean;
  summary: string;
  problem: string;
  technologies: string[];
  topics: string[];
  image: string;
  githubUrl: string;
  demoUrl: string;
  researchNoteSlug: string | null;
  highlights: string[];
  confidentialityNote?: string;
}

export interface ResearchNote {
  id: string;
  slug: string;
  title: string;
  date: string | null;
  status: 'draft' | 'published';
  featured: boolean;
  visible: boolean;
  category: string;
  tags: string[];
  excerpt: string;
  markdownUrl: string;
  relatedProjectId: string | null;
}

export interface ContactContent {
  title: string;
  message: string;
  email: string;
  links: Array<{ id: string; label: string; url: string; visible: boolean }>;
}

export interface FooterContent {
  text: string;
  repositoryUrl: string;
  designCredit: string;
}
