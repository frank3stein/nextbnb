import axios from "axios";
import Head from "next/head";

import Layout from "../components/Layout";

const Bookings = ({ bookings }) => {
  return (
    <Layout
      content={
        <div>
          <Head>
            <title>Your bookings</title>
          </Head>
          <h2>Your bookings</h2>

          <div className="bookings">
            {bookings.map((booking, index) => {
              return (
                <div className="booking" key={index}>
                  <img src={booking.house.picture} alt="House picture" />
                  <div>
                    <h2>
                      {booking.house.title} in {booking.house.town}
                    </h2>
                    <p>
                      Booked from{" "}
                      {new Date(booking.booking.startDate).toDateString()} to{" "}
                      {new Date(booking.booking.endDate).toDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <style jsx>{`
            .bookings {
              display: grid;
              grid-template-columns: 100%;
              grid-gap: 40px;
            }

            .booking {
              display: grid;
              grid-template-columns: 30% 70%;
              grid-gap: 40px;
            }

            .booking img {
              width: 180px;
            }
          `}</style>
        </div>
      }
    />
  );
};

Bookings.getInitialProps = async ctx => {
  // dont forget to pass the cookie to the server
  const response = await axios({
    method: "get",
    url: "http://localhost:3000/api/bookings/list",
    headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined
  });

  return {
    bookings: response.data
  };
};

export default Bookings;
