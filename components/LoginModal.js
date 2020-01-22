export default props => {
  return (
    <>
      <h2>Log in</h2>
      <div>
        <form
          onSubmit={event => {
            alert("Log in!");
            event.preventDefault();
          }}
        >
          <input id="email" type="email" placeholder="Email address" />
          <input id="password" type="password" placeholder="Password" />
          <button>Log in</button>
        </form>
        <p>
          Don't have an account yet?{" "}
          <a href="javascript:;" onClick={() => props.showRegistration()}>
            Sign up
          </a>
        </p>
      </div>
    </>
  );
};
