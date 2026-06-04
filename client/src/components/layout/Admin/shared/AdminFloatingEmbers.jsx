const AdminFloatingEmbers = () => {
  const embers = Array.from({ length: 12 }, (_, index) => ({
    id: index,
    left: `${Math.random() * 100}vw`,
    size: `${Math.random() * 4 + 2}px`,
    duration: `${Math.random() * 8 + 6}s`,
    delay: `${Math.random() * 5}s`,
    background: `hsl(${Math.random() * 30 + 35}, 80%, 55%)`,
  }));

  return (
    <div className="admin-floating-embers">
      {embers.map((ember) => (
        <span
          key={ember.id}
          className="admin-ember"
          style={{
            left: ember.left,
            width: ember.size,
            height: ember.size,
            background: ember.background,
            animationDuration: ember.duration,
            animationDelay: ember.delay,
          }}
        />
      ))}
    </div>
  );
};

export default AdminFloatingEmbers;