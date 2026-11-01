import type {MetadataRoute} from 'next';
import {publicSiteOrigin} from '@/lib/site-origin';
export default function robots():MetadataRoute.Robots{return {rules:[{userAgent:'*',allow:'/',disallow:['/admin','/client','/api/','/data/','/team','/talent','/account','/notifications']}],sitemap:new URL('/sitemap.xml',publicSiteOrigin()).toString()};}
