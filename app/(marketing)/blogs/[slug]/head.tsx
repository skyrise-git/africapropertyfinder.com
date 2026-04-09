import { createClient } from "@/lib/supabase/server";
import { marketingSite } from "@/lib/config";

type Params = { params: { slug: string } };

export default async function Head({ params }: Params) {
  const { slug } = params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("blogs")
    .select("title,excerpt,coverImage,author,publishedAt,createdAt")
    .eq("slug", slug)
    .single();

  const title = data?.title
    ? `${String(data.title)} | ${marketingSite.name} Blog`
    : `${marketingSite.name} Blog`;
  const description = (data?.excerpt as string | undefined) || marketingSite.description;
  const image = (data?.coverImage as string | undefined) || `${marketingSite.url}/opengraph-image`;

  const articleJsonLd = data
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: String(data.title),
        description,
        image: [image],
        author: {
          "@type": "Person",
          name: (data.author as string | undefined) || marketingSite.name,
        },
        publisher: {
          "@type": "Organization",
          name: marketingSite.name,
        },
        datePublished: data.publishedAt
          ? new Date(data.publishedAt as string | number).toISOString()
          : new Date((data.createdAt as string | number | undefined) || Date.now()).toISOString(),
      }
    : null;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="article" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {articleJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      ) : null}
    </>
  );
}
