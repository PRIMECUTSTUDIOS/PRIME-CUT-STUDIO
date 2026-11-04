import {servicePages} from '@/lib/service-pages';
import type {MetadataRoute} from 'next';
import {publicSiteOrigin} from '@/lib/site-origin';
export default function sitemap():MetadataRoute.Sitemap{const base=publicSiteOrigin();return ['/','/services','/portfolio','/rentals','/about','/book','/casting','/privacy','/terms',...servicePages.map(service=>'/services/'+service.slug)].map(path=>({url:new URL(path,base).toString(),changeFrequency:'monthly' as const,priority:path==='/'?1:.7}));}
