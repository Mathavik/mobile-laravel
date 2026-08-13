import React from "react";
import {
  Send,
  WalletCards,
  ShieldCheck,
} from "lucide-react";

const workflowItems = [
  {
    id: 1,
    icon: Send,
    title: "Free Express",
    subtitle: "Shipping",
  },
  {
    id: 2,
    icon: WalletCards,
    title: "No Cost",
    subtitle: "EMI / COD",
  },
  {
    id: 3,
    icon: ShieldCheck,
    title: "1 Year",
    subtitle: "Brand Warranty",
  },
];

function Workflow() {
  return (
    <section className="w-full bg-[#f8fafc] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {workflowItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className={`relative flex items-center gap-4 rounded-2xl bg-white border border-gray-100 shadow-sm px-6 py-6 transition hover:shadow-lg hover:-translate-y-0.5 ${
                  index !== workflowItems.length - 1
                    ? ""
                    : ""
                }`}
              >
                <span className="flex items-center justify-center w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#7c3aed] text-white shadow-lg shadow-[#2563eb]/25">
                  <Icon size={26} strokeWidth={1.8} />
                </span>

                <div>
                  <h3 className="text-[17px] font-bold text-gray-900 leading-5">
                    {item.title}
                  </h3>
                  <p className="text-[14px] font-medium text-gray-500 leading-5 mt-1">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Workflow;