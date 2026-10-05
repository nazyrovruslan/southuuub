import { Metadata } from "next";
import { getSeoData } from "./lib/seo";
import HomeContent from "./home-content";
import { Suspense } from "react";


export async function generateMetadata({ params }: { params: Promise<{ slug?: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const data = await getSeoData(slug);

    if (!data || !data.page) {
        return {
            title: 'Southuuub',
            description: "South HUB – пространство, где участники получают доступ к коллективному разуму C-level в IT и становятся его частью. Мы создаём безопасную среду для свободного высказывания и обмена опытом. Участники сообщества — IT-лидеры, которые делают бизнес в России и мыслят масштабно. Попадите в круг равных, где доверие и открытость вдохновляют создавать новое вместе.",
        };
    }

    const { page, site } = data;
    
    // Основные метаданные
    const metadata: Metadata = {
        title: page.seo_title || page.title,
        description: page.search_description,
        keywords: page.meta_keywords,
        authors: page.seo_author ? [{ name: page.seo_author }] : undefined,
    
        // Open Graph
        openGraph: {
            title: page.og_title || page.seo_title || page.title,
            description: page.og_description || page.search_description,
            images: page.og_image_url ? [
                {
                    url: page.og_image_url,
                    width: 1200,
                    height: 630,
                    alt: page.title,
                }
            ] : [],
            siteName: page.og_site_name || site?.org_name,
            url: page.canonical_url,
            type: 'website',
        },
    
        // Twitter
        twitter: {
            card: page.twitter_card as 'summary' | 'summary_large_image' | 'app' | 'player' || 'summary_large_image',
            title: page.og_title || page.seo_title || page.title,
            description: page.og_description || page.search_description,
            images: page.og_image_url ? [page.og_image_url] : [],
        },
        
        // Каноническая ссылка
        alternates: {
            canonical: page.canonical_url,
        },
    
        // Robots
        robots: {
            index: true,
            follow: true,
        },
  };

  return metadata;
}

export default async function Home({ params }: { params: Promise<{ slug?: string }> }) {
    const { slug } = await params;
    const data = await getSeoData(slug);

    return (
        <Suspense>
            <HomeContent data={data} />
        </Suspense>
    );
}
