import { Hero, ItemGrid, Footer } from '@portfolio/template-kit';
import { COURSES } from '../data/seed';
import { CurriculumAccordion } from './CurriculumAccordion';

const FOOTER_LINKS = [
  { label: 'Giới thiệu', href: '#about' },
  { label: 'Khoá học', href: '#courses' },
  { label: 'Khung chương trình', href: '#curriculum' },
  { label: 'Liên hệ', href: '#contact' },
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
      {/* Interactive enrollment section wired in Task 3 */}
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
