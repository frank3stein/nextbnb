import { useStoreActions, useStoreState } from "easy-peasy";
import axios from "axios";
import Link from "next/link";

export default props => {
  const setShowLoginModal = useStoreActions(
    actions => actions.modals.setShowLoginModal
  );
  const setShowRegistrationModal = useStoreActions(
    actions => actions.modals.setShowRegistrationModal
  );
  const user = useStoreState(state => state.user.user);
  const setUser = useStoreActions(actions => actions.user.setUser);
  return (
    <div className="nav-container">
      <a href="/">
        <img src="/img/logo.png" alt="" />
      </a>
      <nav>
        <ul>
          {user ? (
            <>
              <li className="username">{user}</li>
              <li>
                <Link href="/bookings">
                  <a>Bookings</a>
                </Link>
              </li>
              <li>
                <Link href="/host">
                  <a>Your Houses</a>
                </Link>
              </li>
              <li>
                <Link href="/host/new">
                  <a>Add House</a>
                </Link>
              </li>
              <li className="">
                <a
                  href="#"
                  onClick={async () => {
                    try {
                      await axios.post("api/auth/logout");
                      setUser(null);
                    } catch (error) {
                      console.log(error);
                    }
                  }}
                >
                  Log out
                </a>
              </li>
            </>
          ) : (
            <>
              <li>
                <a href="#" onClick={() => setShowRegistrationModal()}>
                  Sign up
                </a>
              </li>
              <li>
                <a href="#" onClick={() => setShowLoginModal()}>
                  Log in
                </a>
              </li>
            </>
          )}
        </ul>
      </nav>

      <style jsx>{`
        .username {
          padding: 1em 0.5em;
        }
        ul {
          margin: 0;
          padding: 0;
        }

        li {
          display: block;
          float: left;
        }

        a {
          text-decoration: none;
          display: block;
          margin-right: 15px;
          color: #333;
        }

        nav a {
          padding: 1em 0.5em;
        }

        .nav-container {
          border-bottom: 1px solid #eee;
          height: 50px;
        }

        img {
          width: 48px;
          heigth: 48px;
          float: left;
        }

        ul {
          float: right;
        }
      `}</style>
    </div>
  );
};
