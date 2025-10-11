import React from "react";

// JSON data
const packageData = {
  id: 1,
  name: "Package-1",
  ribbon: {
    saveAmount: "1,810",
    text: "SAVE BDT 1,810"
  },
  services: [
    { id: 1, name: "Complete Blood Count (CBC)", price: "400.00" },
    { id: 2, name: "Random Blood Sugar", price: "200.00" },
    { id: 3, name: "Lipid Profile (Random)", price: "1,400.00" },
    { id: 4, name: "Blood Grouping & RH Factor", price: "300.00" },
    { id: 5, name: "Serum Creatinine", price: "400.00" },
    { id: 6, name: "HBsAg", price: "1,000.00" },
    { id: 7, name: "Urine R/E", price: "400.00" },
    { id: 8, name: "ECG", price: "400.00" },
    { id: 9, name: "Digital X-Ray of Chest P/A View (Digital)", price: "600.00" },
    { id: 10, name: "Ultrasonography of Whole Abdomen", price: "2,500.00" },
    { id: 11, name: "Needle, Tube & Reg. Charges", price: "110.00" }
  ],
  pricing: {
    totalCost: "7,710.00",
    discountedPrice: "5,900.00"
  }
};

export default function ServiceCard() {
  return (
    <div className="relative rounded-2xl shadow-md p-6 max-w-2xl mx-auto font-[Poppins] overflow-hidden">
      {/* Enhanced Professional Ribbon */}
      <div className="absolute top-9 -left-14">
        <div className="relative">
          <div className="bg-brand-primary text-white font-semibold px-12 py-3.5 shadow-lg transform -rotate-45 flex items-center justify-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            <span className="text-sm tracking-wide">{packageData.ribbon.text}</span>
          </div>
          {/* Ribbon tail for premium look */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-green-700 border-r-[6px] border-r-transparent"></div>
        </div>
      </div>

      {/* Title */}
      <div className="mt-8 mb-4 flex justify-center">
        <span className="text-2xl font-semibold text-gray-800 tracking-wide">
          {packageData.name}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden">
        <table className="w-full text-gray-600 text-[16px] font-medium">
          <tbody>
            {packageData.services.map((service) => (
              <tr key={service.id}>
                <td className="text-start px-5 py-2">{service.name}</td>
                <td className="text-right px-5 py-2">BDT {service.price}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={2}>
                <hr className="my-2 border-gray-200" />
              </td>
            </tr>
            <tr>
              <td className="px-5 py-2 font-medium text-gray-600">Total Cost:</td>
              <td className="text-right px-5 py-2 text-gray-600">BDT {packageData.pricing.totalCost}</td>
            </tr>
            <tr>
              <td className="px-5 py-2 font-medium text-gray-600">Discounted Price:</td>
              <td className="text-right px-5 py-2 font-bold text-blue-900 text-lg">
                BDT {packageData.pricing.discountedPrice}
              </td>
            </tr>
          </tbody>
        </table>
        <button className="hover:bg-brand-dark rounded-full px-12 bg-brand-primary py-2.5 text-white font-medium">
          Book Now
        </button>
      </div>
    </div>
  );
}