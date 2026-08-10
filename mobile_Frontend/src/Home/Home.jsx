import React from "react";
import Banner from "./banner";
import Categories from "./categories";
import SpotlightSection from "./spotlight";
import NewArrivals from "./newarrivals";
import EditorsPick from "./editors pick";
import Celebration from "./celebration";
import Workflow from "./workflow";

function Home() {
  return (
    <>
      <Banner />
      <Categories />
      <NewArrivals />
      <SpotlightSection />
      <EditorsPick />
      <Celebration />
      <Workflow />
    </>
  );
}

export default Home;
