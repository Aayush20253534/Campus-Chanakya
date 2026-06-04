const LoginFloatingEmbers = () => {
  const embers = Array.from({ length: 20 });

  return (
    <div className="login-floating-embers">
      {embers.map((_, index) => (
        <div
          key={index}
          className="login-ember"
          style={{
            left: `${Math.random() * 100}vw`,
            animationDuration: `${Math.random() * 15 + 10}s`,
            animationDelay: `-${Math.random() * 20}s`,
          }}
        ></div>
      ))}
    </div>
  );
};

export default LoginFloatingEmbers;
