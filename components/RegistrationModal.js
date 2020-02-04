import { useState } from "react";

export default props => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordconfirmation, setPasswordconfirmation] = useState("");

  return (
    <>
      <h2>Sign up</h2>
      <div>
        <form
          onSubmit={event => {
            console.log(email, password, passwordconfirmation);
            event.preventDefault();
          }}
        >
          <input
            id="email"
            type="email"
            placeholder="Email address"
            onChange={event => setEmail(event.target.value)}
          />
          <input
            id="password"
            type="password"
            placeholder="Password"
            onChange={event => setPassword(event.target.value)}
          />
          <input
            id="passwordconfirmation"
            type="password"
            placeholder="Enter password again"
            onChange={event => setPasswordconfirmation(event.target.value)}
          />
          <button>Sign up</button>
        </form>
        <p>
          Already have an account?{" "}
          <a href="javascript:;" onClick={() => props.showLogin()}>
            Log in
          </a>
        </p>
      </div>
    </>
  );
};
