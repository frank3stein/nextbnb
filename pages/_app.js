import App from "next/app";
import { StoreProvider } from "easy-peasy";
import store from "../store";

function MyApp({ Component, pageProps, user }) {
  if (user) {
    store.getActions().user.setUser(user);
  }
  return (
    <StoreProvider store={store}>
      <Component {...pageProps} />
    </StoreProvider>
  );
}

export default MyApp;

MyApp.getInitialProps = async appContext => {
  const appProps = await App.getInitialProps(appContext);

  let user = null;
  if (
    appContext.ctx.req &&
    appContext.ctx.req.session &&
    appContext.ctx.req.session.passport &&
    appContext.ctx.req.session.passport.user
  ) {
    user = appContext.ctx.req.session.passport.user;
  }

  return { ...appProps, user: user };
};
