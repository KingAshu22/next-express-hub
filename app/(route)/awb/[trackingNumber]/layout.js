export default function AWBLayout({ children }) {
  return (
    <div className="min-h-screen">
      {/* Only render the content without sidebar or header */}
      <main>{children}</main>
    </div>
  );
}
