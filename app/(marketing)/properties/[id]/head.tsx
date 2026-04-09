import { createClient } from "@/lib/supabase/server";
import { marketingSite } from "@/lib/config";

type Params = { params: { id: string } };

export default async function Head({ params }: Params) {
  const { id } = params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id,title,address,city,state,propertyType,listingType,price,rent,images,createdAt")
    .eq("id", id)
    .single();

  const title = data?.title
    ? `${data.title} | ${marketingSite.name}`
    : `Property details | ${marketingSite.name}`;
  const description =
    data?.address && data?.city
      ? `${data.propertyType} in ${data.city}, ${data.state}. View pricing, safety insights, and neighborhood trends on ${marketingSite.name}.`
      : marketingSite.description;
  const images = (data?.images as Array<{ url?: string }> | undefined) ?? [];
  const image = images[0]?.url || `${marketingSite.url}/opengraph-image`;
  const price =
    data?.listingType === "sale" ? data?.price : data?.rent;

  const listingJsonLd = data
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: data.title,
        description,
        image: image ? [image] : undefined,
        brand: marketingSite.name,
        offers: price
          ? {
              "@type": "Offer",
              priceCurrency: "USD",
              price,
              availability: "https://schema.org/InStock",
            }
          : undefined,
      }
    : null;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {listingJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd) }}
        />
      ) : null}
    </>
  );
}
