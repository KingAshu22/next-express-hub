export default function BackFooter() {
  return (
    <footer>
      <div className="container mx-auto">
        <div className="border-t border-gray-700 py-4 text-center">
          <p>
            &copy; {new Date().getFullYear()} Designed & Developed By{" "}
            <a className="text-[#F44336]" href="https://exprova.com" target="_blank" rel="noopener noreferrer">
              Exprova.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
