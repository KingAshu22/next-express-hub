import { motion } from "framer-motion";

export default function GetQuoteSection() {
  return (
    <section className="bg-[#f4f8ff] py-10 md:py-16 flex justify-center">
      <div className="w-full max-w-6xl px-2 sm:px-4 flex flex-col md:flex-row gap-8 md:gap-10 items-center md:items-start">
        {/* Left: Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
          className="w-full md:w-1/2"
        >
          <h3 className="text-xl sm:text-2xl font-bold text-[#2563eb] mb-1">Get a Quote</h3>
          <div className="w-24 sm:w-32 h-2 bg-yellow-400 rounded mb-4" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#232C65] mb-4">
            No surprises. Just honest, upfront pricing.
          </h2>
          <p className="text-gray-700 mb-6 max-w-xl text-base sm:text-lg">
            Say goodbye to hidden fees and last-minute surprises. Get instant, transparent quotes that show you exactly what you’ll pay—no guesswork, no confusion. Perfect for businesses that value clarity and fairness.
            <br /><br />
            <span className="font-semibold text-[#232C65]">Simply share your details</span>, and our team will reach out with the best shipping rates, customized for your business.
          </p>
        </motion.div>

        {/* Right: Form */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true }}
          className="w-full md:w-1/2 max-w-md"
        >
          <form className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 w-full">
            <h3 className="text-lg sm:text-xl font-bold mb-2">
              Explore <span className="text-[#232C65]">Kargo One</span>
              <span className="text-yellow-500"> Pricing</span>
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="First Name"
                className="flex-1 border-b border-gray-200 focus:border-blue-500 outline-none py-2 transition text-sm sm:text-base"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                className="flex-1 border-b border-gray-200 focus:border-blue-500 outline-none py-2 transition text-sm sm:text-base"
                required
              />
            </div>
            <input
              type="text"
              placeholder="Mobile Number"
              className="w-full border-b border-gray-200 focus:border-blue-500 outline-none py-2 transition text-sm sm:text-base"
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full border-b border-gray-200 focus:border-blue-500 outline-none py-2 transition text-sm sm:text-base"
              required
            />
            <div className="flex flex-col gap-2">
              <label className="font-medium text-gray-700 text-sm sm:text-base">Are you selling Internationally?</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-1 text-sm sm:text-base">
                  <input type="radio" name="international" value="yes" required />
                  Yes
                </label>
                <label className="flex items-center gap-1 text-sm sm:text-base">
                  <input type="radio" name="international" value="no" />
                  No
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-gray-700 text-sm sm:text-base">Are you an e-commerce seller?</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-1 text-sm sm:text-base">
                  <input type="radio" name="ecommerce" value="yes" required />
                  Yes
                </label>
                <label className="flex items-center gap-1 text-sm sm:text-base">
                  <input type="radio" name="ecommerce" value="no" />
                  No
                </label>
              </div>
            </div>
            <div>
              <label className="font-medium text-gray-700 text-sm sm:text-base">Average monthly volume?</label>
              <select className="w-full border-b border-gray-200 focus:border-blue-500 outline-none py-2 transition bg-transparent text-sm sm:text-base">
                <option>Please Select</option>
                <option>Less than 50</option>
                <option>50 - 200</option>
                <option>200 - 1000</option>
                <option>1000+</option>
              </select>
            </div>
            <p className="text-xs text-gray-500">
              Your registration is subject to our <a href="#" className="underline text-blue-600">Terms & Conditions</a> and <a href="#" className="underline text-blue-600">Privacy Policy</a>.
            </p>
            <button
              type="submit"
              className="w-full bg-[#232C65] hover:bg-[#2563eb] text-white font-bold py-3 rounded-xl text-base sm:text-lg transition-all duration-200 shadow hover:shadow-lg"
            >
              Start Shipping!
            </button>
            <p className="text-xs sm:text-sm text-gray-600 text-center">
              Already have an account? <a href="#" className="font-bold text-[#232C65] hover:underline">Login</a>
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  );
}