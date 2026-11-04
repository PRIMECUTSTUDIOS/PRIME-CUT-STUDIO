import Link from 'next/link';
import {serviceAreas, servicePages} from '@/lib/service-pages';

export function ServiceLinks() {
  return <section className="shell section" aria-labelledby="local-services">
    <h2 id="local-services">Photography and video services</h2>
    <p>Based in Killeen and serving {serviceAreas.slice(1, -1).join(', ')} and the rest of Central Texas.</p>
    <ul>{servicePages.map(service => <li key={service.slug}>
      <Link href={'/services/' + service.slug}>{service.title}</Link>
    </li>)}</ul>
  </section>;
}
