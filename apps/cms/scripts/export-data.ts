/**
 * Shared ExportData type re-exported so the emitters under
 * `apps/cms/scripts/lib/emitters/` can import it without a circular dep on
 * the export-fallbacks.ts orchestrator.
 */

import type { SiteMeta } from './lib/schemas/site-meta';
import type { MorphShape } from './lib/schemas/morph-shape';
import type { ErrorPageContent } from './lib/schemas/nav';
import type { BlogPost } from './lib/schemas/blog';
import type { Service } from './lib/schemas/service';
import type { Project } from './lib/schemas/project';
import type { TechStackItem } from './lib/schemas/tech-stack';
import type {
	BlogPageContent,
	ProjectsPageContent,
	TechStackPageContent,
	ContactContent,
	HeroContent,
	ManifestoContent,
	ProofReelContent,
	ServicesGridContent,
	AboutIntroContent,
	CtaContent,
	CloserContent,
	AboutContent,
} from './lib/schemas/page-blocks';
import type { NavData } from './lib/fetchers/nav';

export interface ExportData {
	siteMeta?: SiteMeta;
	morphShapes?: readonly MorphShape[];
	errorPageFallback?: ErrorPageContent;
	nav?: NavData;
	blogPosts?: readonly BlogPost[];
	services?: readonly Service[];
	projects?: readonly Project[];
	techStack?: readonly TechStackItem[];
	blogPage?: BlogPageContent;
	projectsPage?: ProjectsPageContent;
	techStackPage?: TechStackPageContent;
	contactPage?: ContactContent;
	hero?: HeroContent;
	manifesto?: ManifestoContent;
	proofReel?: ProofReelContent;
	servicesGrid?: ServicesGridContent;
	aboutIntro?: AboutIntroContent;
	cta?: CtaContent;
	closer?: CloserContent;
	aboutPage?: AboutContent;
}
