import Link from 'next/link';
import {notFound} from 'next/navigation';
import {SiteHeader} from '@/components/SiteHeader';
import {Footer} from '@/components/Footer';
import {publicMetadata} from '@/lib/public-metadata';
import {serviceAreas, servicePages} from '@/lib/service-pages';
import {publicSiteOrigin} from '@/lib/site-origin';

type Props = {params: Promise<{slug: string}>};

export function generateStaticParams() {
  return servicePages.map(({slug}) => ({slug}));
}

async function getService({params}: Props) {
  const {slug} = await params;
  return servicePages.find(service => service.slug === slug) ?? notFound();
}

export async function generateMetadata(props: Props) {
  const service = await getService(props);
  return publicMetadata(service.title, service.description, '/services/' + service.slug);
}

export default async function ServicePage(props: Props) {
  const service = await getService(props);
  const origin = publicSiteOrigin();
  const url = origin + '/services/' + service.slug;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {'@type': 'Service', name: service.title, description: service.description, url,
        provider: {'@id': origin + '/#studio'}, areaServed: serviceAreas},
      {'@type': 'BreadcrumbList', itemListElement: [
        {'@type': 'ListItem', position: 1, name: 'Home', item: origin + '/'},
        {'@type': 'ListItem', position: 2, name: 'Services', item: origin + '/services'},
        {'@type': 'ListItem', position: 3, name: service.title, item: url},
      ]},
    ],
  };
  return <><SiteHeader/><main className="shell section">
    <nav aria-label="Breadcrumb"><Link href="/">Home</Link> / <Link href="/services">Services</Link></nav>
    <h1>{service.title}</h1>
    <p>{service.description}</p>
    <h2>Planning your production</h2>
    <p>{service.planning}</p>
    <h2>What to include in your quote request</h2>
    <p>{service.deliverables}</p>
    <p><Link href={'/book?service=' + service.category} className="btn">Request a quote</Link>{' '}
      <Link href="/portfolio" className="btn secondary">View our work</Link></p>
    <h2 lang="es">{service.spanish}</h2>
    <p lang="es"><Link href={'/book?service=' + service.category + '&lang=es'}>Solicita una cotización en español</Link></p>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema).replace(/</g, '\\u003c')}}/>
  </main><Footer/></>;
}
