import { describe, expect, test } from "bun:test";
import {
  getCountryCodeFromHost,
  getCountryDomainConfig,
  getMarketingSeoForHost,
} from "@/lib/config/country-domain";

describe("country domain helpers", () => {
  test("resolves country subdomains from hosts", () => {
    expect(getCountryCodeFromHost("za.africapropertyfinder.com")).toBe("ZA");
    expect(getCountryCodeFromHost("zw.africapropertyfinder.com")).toBe("ZW");
    expect(getCountryCodeFromHost("za.africapropertyfinder.com:443")).toBe(
      "ZA",
    );
    expect(getCountryCodeFromHost("www.africapropertyfinder.com")).toBeNull();
  });

  test("returns country production origins", () => {
    expect(getCountryDomainConfig("ZA").origin).toBe(
      "https://za.africapropertyfinder.com",
    );
    expect(getCountryDomainConfig("ZW").origin).toBe(
      "https://zw.africapropertyfinder.com",
    );
  });

  test("returns host-specific marketing SEO", () => {
    expect(getMarketingSeoForHost("za.africapropertyfinder.com")).toMatchObject(
      {
        title:
          "Property for Sale and Rent in South Africa | Africa Property Finder",
        canonical: "https://za.africapropertyfinder.com",
      },
    );
    expect(getMarketingSeoForHost("zw.africapropertyfinder.com")).toMatchObject(
      {
        title:
          "Property for Sale and Rent in Zimbabwe | Africa Property Finder",
        canonical: "https://zw.africapropertyfinder.com",
      },
    );
    expect(
      getMarketingSeoForHost("www.africapropertyfinder.com"),
    ).toMatchObject({
      title: "Africa Property Finder",
      canonical: "https://www.africapropertyfinder.com",
    });
  });
});
