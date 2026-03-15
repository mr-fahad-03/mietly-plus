import { ClientNavbar } from "@/components/client-navbar";
import { HomeBannerSection } from "@/components/home-banner-section";
import { HomeBenefitsStrip } from "@/components/home-benefits-strip";
import { HomeCategoriesSection } from "@/components/home-categories-section";
import { HomePopularProducts } from "@/components/home-popular-products";
import { HomeRandomPicks } from "@/components/home-random-picks";
import { HomeBrandsSlider } from "@/components/home-brands-slider";
import { HomeRentNowCta } from "@/components/home-rent-now-cta";
import { HomeRentalSteps } from "@/components/home-rental-steps";
import { HomeTrustAndSteps } from "@/components/home-trust-and-steps";
import { HomeFooter } from "@/components/home-footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <ClientNavbar />
      <HomeBannerSection />
      <HomeBenefitsStrip />
      <HomeCategoriesSection />
      <HomePopularProducts />
      <HomeRandomPicks />
      <HomeRentalSteps />
      <HomeRentNowCta />
      <HomeBrandsSlider />
      <HomeTrustAndSteps />
      <HomeFooter />
    </div>
  );
}
