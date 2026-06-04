const DashboardFloatingEmbers = () => {
  const embers = Array.from({ length: 12 });

  return (
    <div className="dashboard-floating-embers">
      {embers.map((_, index) => {
        const size = Math.random() * 6 + 3;
        const duration = Math.random() * 20 + 25;
        const delay = Math.random() * -20;

        return (
          <div
            key={index}
            className="dashboard-ember"
            style={{
              left: `${Math.random() * 100}vw`,
              width: `${size}px`,
              height: `${size}px`,
              background:
                "radial-gradient(circle, hsla(35, 100%, 60%, 0.8), hsla(30, 100%, 50%, 0.4))",
              boxShadow: `0 0 ${size * 2}px hsla(35, 100%, 60%, 0.3)`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          ></div>
        );
      })}
    </div>
  );
};

export default DashboardFloatingEmbers;