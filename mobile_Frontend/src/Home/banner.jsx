import bannerImage from "../assets/banner.png";

function Banner() {
  return (
    <section className="pt-[80px] md:pt-[100px] pb-6 md:pb-8 px-4 md:px-0">
<div
  className="
    max-w-[1220px]
    mx-auto
    h-[300px]
    sm:h-[420px]
    md:h-[540px]
    bg-cover
    bg-no-repeat
    bg-[72%_center]
    md:bg-center
    flex
    items-center
  "
  style={{ backgroundImage: `url(${bannerImage})` }}
>
        <div
          className="
            w-full
            max-w-[420px]
            ml-6
            sm:ml-10
            md:ml-[55px]
            text-white
          "
        >
          {/* Heading */}
          <h1
            className="
              font-porsha
              text-[34px]
              sm:text-[42px]
              md:text-[50px]
              lg:text-[58px]
              leading-[1]
            "
          >
            Styled For Every
            <br />
            Cherished Moments
          </h1>

          {/* Offer */}
          <div className="mt-6 md:mt-8 flex items-end gap-2">
            <span className="text-xs sm:text-sm md:text-base font-medium uppercase mb-1">
              FLAT
            </span>

            <span className="font-porsha text-3xl sm:text-4xl md:text-[48px] leading-none">
              30-50%
            </span>

            <span className="text-base sm:text-lg md:text-xl uppercase mb-1">
              OFF
            </span>
          </div>

          {/* Button */}
          {/* <button className="mt-8 md:mt-10 h-12 w-32 bg-white text-black text-xs font-semibold hover:bg-black hover:text-white transition">
            SHOP NOW
          </button> */}
        </div>
      </div>
    </section>
  );
}

export default Banner;