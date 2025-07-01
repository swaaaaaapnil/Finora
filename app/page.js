import Herosection from "@/components/hero";
import { statsData, featuresData, howItWorksData, testimonialsData } from "@/data/landing";
import HomeLandingClient from "./_components/HomeLandingClient";

export default function HomePage() {
  return (
    <div>
      <Herosection />
      <HomeLandingClient
        statsData={statsData}
        featuresData={featuresData}
        howItWorksData={howItWorksData}
        testimonialsData={testimonialsData}
      />
    </div>
  );
}
