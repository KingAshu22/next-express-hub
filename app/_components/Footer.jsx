export default function Footer() {
  return (
    <footer className="bg-[#232C65] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <div>
            <h3 className="text-xl font-bold mb-4">About Us</h3>
            <p className="text-gray-300">
              Kargo One is a trusted provider of reliable and cost-effective cross-border shipping solutions for businesses and individuals. We specialize in delivering parcels and cargo quickly and securely, ensuring your shipments reach their destination on time. With a commitment to excellence and customer satisfaction, we simplify global shipping to connect people and businesses worldwide.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                International Shipping
              </li>
              <li>
                Express Delivery
              </li>
              <li>
                Cargo Services
              </li>
              <li>
                Business Solutions
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <p className="text-gray-300 mb-2">
              <span className="font-semibold">Phone:</span>+91 81691 55537
            </p>
            <div className="mb-4">
              <p className="font-semibold text-white">Mumbai Office:</p>
              <p className="text-gray-300">
                Shop no 10, Ground floor Prakashwadi CHS Beside Summit Business park, Gundavali, Andheri East, Mumbai, Maharashtra 400093
              </p>
            </div>
            <div>
              <p className="font-semibold text-white">Hyderabad | Bangalore | Kerala</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>
            &copy; {new Date().getFullYear()} Exprova. All rights reserved | Designed & Developed by{" "}
            <a className="text-[#F44336]" href="https://exprova.com" target="_blank" rel="noopener noreferrer">
              Exprova.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
