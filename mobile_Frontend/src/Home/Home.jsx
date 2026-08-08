import React from "react";
import Banner from "./banner";
import Celebration from "./celebration";
import NewArrivals from "./newarrivals";
import Workflow from "./workflow";
import SpotlightSection from "./spotlight";
import EditorsPick from "./editors pick";
// import ForEveryOccasion from "./ForEveryOccasion";

function Home() {
  return (
    <>
      <Banner />
      <SpotlightSection />
      {/* <ForEveryOccasion/> */}
      <NewArrivals />
      <EditorsPick/>
      <Celebration />
      <Workflow />
    </>
  );
}

export default Home;