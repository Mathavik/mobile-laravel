import React from "react";
import {
  Send,
  WalletCards,
  PackageCheck,
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
    title: "Pay on",
    subtitle: "Delivery",
  },
  {
    id: 3,
    icon: PackageCheck,
    title: "No Returns",
    subtitle: "& Exchanges",
  },
];

function Workflow() {
  return (
    <section className="w-full bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {workflowItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className={`relative flex flex-col items-center justify-center py-10 px-6
                ${
                  index !== workflowItems.length - 1
                    ? "md:border-r border-gray-300"
                    : ""
                }`}
              >
                <Icon
                  size={36}
                  strokeWidth={1.5}
                  className="text-gray-700 mb-4"
                />

                <h3 className="text-[17px] font-medium text-gray-900 leading-5 text-center">
                  {item.title}
                </h3>

                <p className="text-[17px] font-medium text-gray-900 leading-5 text-center mt-1">
                  {item.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Workflow;