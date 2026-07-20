import { Search } from "lucide-react";

export default function BlogSearchBar({ defaultValue = "", className = "" }) {
  return (
    <form
      action="/blogs"
      method="GET"
      role="search"
      className={`relative w-full max-w-xl ${className}`}
    >
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        aria-hidden="true"
      />
      <input
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search blog posts (e.g. customs, packaging, DHL rates)..."
        aria-label="Search blog posts"
        className="w-full pl-12 pr-28 py-3.5 rounded-full border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-purple-900 hover:bg-purple-800 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
      >
        Search
      </button>
    </form>
  );
}
