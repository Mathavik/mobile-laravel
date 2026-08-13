import { Phone, Mail, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";

function Footer() {
  const currentYear = new Date().getFullYear(); // Dynamic year

  return (
    <footer className="w-full bg-white overflow-hidden">
      <div className="max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Gradient Border */}
        <div className="h-[3px] bg-gradient-to-r from-[#2563eb] via-[#7c3aed] to-[#06b6d4]"></div>

        {/* Main Footer */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,2.2fr)_repeat(4,minmax(0,1fr))] justify-center text-center lg:text-left gap-x-8 gap-y-10 py-[60px]">

          {/* Logo */}
          <div>
            <div className="flex items-center gap-1.5 justify-center lg:justify-start">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#7c3aed] text-white shadow-lg shadow-[#2563eb]/30">
                <Smartphone size={18} />
              </span>
              <span className="text-xl font-bold tracking-tight text-[#0f172a]">
                Mobile<span className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] bg-clip-text text-transparent">Kart</span>
              </span>
            </div>
            <p className="mt-8 max-w-[215px] text-[12px] leading-[18px] text-[#111111] mx-auto lg:mx-0">
              Your trusted destination for the latest smartphones,
              feature phones and accessories at unbeatable prices.
              Shop smart, stay connected.
            </p>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase mb-5 tracking-wide">
              CUSTOMER CARE
            </h3>
            <ul className="space-y-[10px] text-[12px] text-[#111111]">
              <li><a href="#">Orders & Shipment</a></li>
              <li><a href="#">Returns & Exchange</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">FAQs</a></li>
            </ul>
          </div>

          {/* Experience */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase mb-5 tracking-wide">
              EXPERIENCE
            </h3>
            <ul className="space-y-[10px] text-[12px] text-[#111111]">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Bulk Orders</a></li>
              <li><a href="#">Sitemap</a></li>
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase mb-5 tracking-wide">
              EXPLORE
            </h3>
            <ul className="space-y-[10px] text-[12px] text-[#111111]">
              <li><Link to="/mobiles">Smartphones</Link></li>
              <li><Link to="/mobiles">Accessories</Link></li>
              <li><Link to="/mobiles">Latest Arrivals</Link></li>
              <li><Link to="/mobiles">All Products</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase mb-5 tracking-wide">
              CONTACT US
            </h3>
            <div className="space-y-4 flex flex-col items-center lg:items-start w-full max-w-[280px]">
              <div className="flex items-center gap-3 text-[12px]">
                <Phone size={15} strokeWidth={2} />
                <span className="whitespace-nowrap">+91 93899 03752</span>
              </div>
              <div className="flex items-center gap-3 text-[12px] max-w-full">
                <Mail size={15} strokeWidth={2} className="shrink-0" />
                <span className="break-all">support@mobilekart.in</span>
              </div>
            </div>

            <h3 className="text-[13px] font-semibold uppercase mt-10 mb-4 tracking-wide">
              FOLLOW US
            </h3>
            <div className="flex justify-center lg:justify-start items-center gap-4 text-[16px]">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFacebookF />
              </a>

              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram />
              </a>

              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaYoutube />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-[#E5E5E5] py-5 flex flex-col lg:flex-row items-center justify-between text-center lg:text-left">
          <p className="text-[12px] text-[#222222]">
            © {currentYear} MobileKart. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-[#222222] mt-3 lg:mt-0">
            <a href="#">Privacy Policy</a>
            <a href="#">Refund Policy</a>
            <a href="#">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;