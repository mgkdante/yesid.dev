// Barrel re-exports for the slice-17f L1 test data factories.
//
// Consumer pattern:
//   import { projectFactory, serviceFactory } from '../../../tests/factories';
//   const project = projectFactory.build({ status: 'public' });
//
// Each factory is a `Factory<T>` from interface-forge — see individual files
// for defaults. The `_block-editor-doc` helper is INTENTIONALLY not exported
// (underscore prefix marks it as internal to the factories module).

export { routeSeoFactory } from './route-seo.factory';
export { serviceFactory } from './service.factory';
export { projectFactory } from './project.factory';
export { blogPostFactory } from './blog-post.factory';
export { siteMetaFactory } from './site-meta.factory';
export { navLinkFactory } from './nav-link.factory';
export { errorPageFactory } from './error-page.factory';
export { pageSeoFactory } from './page-seo.factory';
export { morphShapeFactory } from './morph-shape.factory';
export { heroDataFactory } from './hero-data.factory';
export { techStackFactory } from './tech-stack.factory';
export { jsonldFactory } from './jsonld.factory';
export { siteSeoDefaultsFactory } from './site-seo-defaults.factory';
export { iconRecordFactory } from './icon-record.factory';
