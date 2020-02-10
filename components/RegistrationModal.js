import { useStoreActions, useStore } from "easy-peasy";
const { useState } = require("react");
const axios = require("axios");

export default props => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const setUser = useStoreActions(actions => actions.user.setUser);
  const setHideModal = useStoreActions(actions => actions.modals.setHideModal);
  const submit = async () => {
    // const response = await axios.post("/api/auth/register", {
    //   email,
    //   password,
    //   passwordConfirmation
    // });
    // console.log(response);
    try {
      const response = await axios.post("api/auth/register", {
        email,
        password,
        passwordConfirmation
      });
      console.log(response);
      if (response.data.status === "error") {
        alert(response.data.error);
        return;
      }
      setUser(email);
      setHideModal();
    } catch (error) {
      console.log(error);
      alert(error.response.data.error);
      return;
    }
    event.preventDefault();
  };
  return (
    <>
      <h2>Sign up</h2>
      <div>
        <form onSubmit={submit}>
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
            onChange={event => setPasswordConfirmation(event.target.value)}
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
