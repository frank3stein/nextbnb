// import Houses from "../houses.json";
import axios from "axios";
import fetch from "isomorphic-unfetch";
import Head from "next/head";
import Layout from "../../components/Layout";
import DateRangePicker from "../../components/DateRangePicker";
import calculateNights from "../../utils/calculate-nights.js";
import { useState } from "react";
import { useStoreActions, useStoreState } from "easy-peasy";
// import { Stripe } from "stripe";

const getBookedDates = async house => {
  try {
    const houseId = house.id;
    const response = await axios.post(
      "http://localhost:3000/api/houses/booked",
      { houseId }
    );
    if (response.data.status === "error") {
      alert(response.data.message);
      return;
    }
    return response.data.dates;
  } catch (error) {
    console.error(error);
    return;
  }
};

const canReserve = async (houseId, startDate, endDate) => {
  try {
    const response = await axios.post(
      "http://localhost:3000/api/houses/check",
      { houseId, startDate, endDate }
    );
    if (response.data.status === "error") {
      alert(response.data.message);
      return;
    }

    if (response.data.message === "busy") return false;
    return true;
  } catch (error) {
    console.error(error);
    return;
  }
};

const getDatesBetweenDates = (startDate, endDate) => {
  let dates = [];
  while (startDate < endDate) {
    dates = [...dates, new Date(startDate)];
    startDate.setDate(startDate.getDate() + 1);
  }
  dates = [...dates, endDate];
  return dates;
};

const House = ({ house, bookedDates }) => {
  const user = useStoreState(state => state.user.user);
  const setShowLoginModal = useStoreActions(
    actions => actions.modals.setShowLoginModal
  );
  const [dateChosen, setDateChosen] = useState(false);
  const [stayNights, setStayNights] = useState(0);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const content = (
    <div className="container">
      <Head>
        <title>{house.title}</title>
      </Head>
      <article>
        <img src={house.picture} width="100%" alt="House picture" />
        <p>
          {house.type} - {house.town}
        </p>
        <p>{house.title}</p>
        {/* <p>
          {house.rating} ({house.reviewsCount})
        </p> // removed*/}
      </article>
      <aside>
        <h2>Add dates for prices.</h2>
        <DateRangePicker
          datesChanged={(startDate, endDate) => {
            setDateChosen(true);
            setStayNights(calculateNights(startDate, endDate));
            console.log(startDate, endDate);
            setStartDate(startDate);
            setEndDate(endDate);
          }}
          bookedDates={bookedDates}
        />
        {(dateChosen && (
          <div>
            <h2>Price per night</h2>
            <p>${house.price}</p>
            <h2>Total price for the booking</h2>
            <p>${(stayNights * house.price).toFixed(2)}</p>
            {user ? (
              <button
                className="reserve"
                onClick={async () => {
                  if (!(await canReserve(house.id, startDate, endDate))) {
                    alert("The dates chosen are invalid");
                    return;
                  }

                  try {
                    const sessionResponse = await axios.post(
                      "/api/stripe/session",
                      {
                        amount:
                          house.price *
                          getDatesBetweenDates(startDate, endDate).length
                      }
                    );
                    if (sessionResponse.data.status === "error") {
                      alert(sessionResponse.data.message);
                      return;
                    }
                    const stripePublicKey =
                      sessionResponse.data.stripePublicKey;

                    const sessionId = sessionResponse.data.sessionId;

                    const response = await axios.post("/api/houses/reserve", {
                      houseId: house.id,
                      startDate,
                      endDate,
                      sessionId
                    });

                    if (response.data.status === "error") {
                      alert(response.data.message);
                      return;
                    }
                    const stripe = Stripe(stripePublicKey);
                    const { error } = await stripe.redirectToCheckout({
                      sessionId
                    });
                  } catch (err) {
                    console.log(err);
                    return;
                  }
                }}
              >
                Reserve
              </button>
            ) : (
              <button
                className="reserve"
                onClick={() => {
                  setShowLoginModal();
                }}
              >
                Log in to Reserve
              </button>
            )}
          </div>
        )) || <p>Please select dates</p>}
      </aside>
      {house.reviewsCount ? (
        <div className="reviews">
          <h3>{house.reviewsCount} Reviews</h3>

          {house.reviews.map((review, index) => {
            return (
              <div key={index}>
                <p>{new Date(review.createdAt).toDateString()}</p>
                <p>{review.comment}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <></>
      )}
      <style jsx>{`
        .container {
          display: grid;
          grid-template-columns: 60% 40%;
          grid-gap: 30px;
        }

        aside {
          border: 1px solid #ccc;
          padding: 20px;
        }
      `}</style>
    </div>
  );
  return <Layout content={content}></Layout>;
};

// House.getInitialProps = ({ query }) => {
//   // our query is taken from the url
//   const { id } = query; // houses/queryParameters. It is in the file name [id].js
//   console.log(query);
//   return {
//     house: Houses.filter(house => house.id === id)[0]
//   };
// };

House.getInitialProps = async ({ query }) => {
  const { id } = query;

  const res = await fetch(`http://localhost:3000/api/houses/${id}`);
  const house = await res.json();

  const bookedDates = await getBookedDates(house);

  return {
    house,
    bookedDates
  };
};

export default House;
