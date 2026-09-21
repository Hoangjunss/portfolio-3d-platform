import { Hero, ItemGrid, Footer } from '@portfolio/template-kit';
import { COURSES } from '../data/seed';
import { CurriculumAccordion } from './CurriculumAccordion';
import { EnrollmentSection } from './EnrollmentSection';

// Only sections this page actually renders. #about and #contact were here and matched no id on
// the page, so both were dead links; this composition has no About or Contact section to point at.
const FOOTER_LINKS = [
  { label: 'Khoá học', href: '#courses' },
  { label: 'Khung chương trình', href: '#curriculum' },
];

export default function EducationPage() {
  return (
    <main>
      <Hero
        headline="Sông Hồng Academy"
        subhead="Chương trình đào tạo chuyên sâu và chứng chỉ nghề nghiệp dành cho người đi làm."
        ctaLabel="Xem các khoá học"
        ctaHref="#courses"
      />
      <EnrollmentSection courses={COURSES} />
      <section id="courses" aria-label="Danh sách khoá học">
        <ItemGrid items={COURSES} />
      </section>
      <div id="curriculum">
        <CurriculumAccordion courses={COURSES} />
      </div>
      <Footer links={FOOTER_LINKS} showSocial={true} />
    </main>
  );
}
