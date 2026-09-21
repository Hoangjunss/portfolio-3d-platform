export { Hero } from './components/Hero';
export { Footer } from './components/Footer';
export { ItemGrid } from './components/ItemGrid';
export { PricedItemGrid } from './components/PricedItemGrid';
export { PeopleGrid } from './components/PeopleGrid';
export { Timeline } from './components/Timeline';
export { PhotoGallery } from './components/PhotoGallery';
export { InquiryForm } from './components/InquiryForm';
export { StatBlock } from './components/StatBlock';
export { SavedItemsPanel } from './components/SavedItemsPanel';
export { CompareTray } from './components/CompareTray';
export { CartDrawer, CartBadge } from './components/CartDrawer';
export { CommentThread } from './components/CommentThread';
export { KanbanBoard } from './components/KanbanBoard';
export { RecordTable } from './components/RecordTable';
export { useLocalCollection } from './useLocalCollection';
export { assertValidTheme } from './theme';
export type { TemplateTheme } from './theme';

// Item and prop types. Sites need these to type their own data/seed.ts against the shapes the
// components actually accept; without them each site re-declares its own near-copy and the two
// drift silently. Adding them is additive -- no existing import changes.
export type { HeroProps } from './components/Hero';
export type { FooterLink, FooterProps } from './components/Footer';
export type { GridItem, ItemGridProps } from './components/ItemGrid';
export type { PricedItem, PricedItemGridProps } from './components/PricedItemGrid';
export type { Person, PeopleGridProps } from './components/PeopleGrid';
export type { TimelineEntry, TimelineProps } from './components/Timeline';
export type { Photo, PhotoGalleryProps } from './components/PhotoGallery';
export type { InquiryField, InquiryFormProps } from './components/InquiryForm';
export type { Stat, StatBlockProps } from './components/StatBlock';
export type { SavedItemsPanelProps } from './components/SavedItemsPanel';
export type { CompareTrayProps } from './components/CompareTray';
export type { CartLine, CartBadgeProps, CartDrawerProps } from './components/CartDrawer';
export type { Comment, CommentThreadProps } from './components/CommentThread';
export type { KanbanColumn, KanbanItem, KanbanBoardProps } from './components/KanbanBoard';
export type { RecordTableColumn, RecordTableProps } from './components/RecordTable';
export type { LocalCollectionItem, UseLocalCollectionResult } from './useLocalCollection';
