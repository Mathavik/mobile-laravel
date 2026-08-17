import React from "react";
import Banner from "./banner";
// import BannerSplit from "./bannerSplit";
import Categories from "./categories";
import FeaturedPhones from "./featuredPhones";
import SpotlightSection from "./spotlight";
import NewArrivals from "./newarrivals";
import FlashSale from "./flashsale";
import EditorsPick from "./editors pick";
import Celebration from "./celebration";
import Workflow from "./workflow";
import Reveal from "../components/Reveal";

function Home() {
  return (
    <>
      <Banner />
      <Reveal>
        <Categories />
      </Reveal>
      
      
      <Reveal>
        <NewArrivals />
      </Reveal>
      <FlashSale />
      <Reveal>
        <SpotlightSection />
      </Reveal>
      <Reveal>
        <EditorsPick />
      </Reveal>
      <Reveal>
        <Celebration />
      </Reveal>
      <Reveal>
        <FeaturedPhones />
        <Workflow />
      </Reveal>
      
    </>
  );
}

export default Home;
