import Houses from "../houses.json";
import Head from "next/head";
import Layout from "../../components/Layout";
import DateRangePicker from "../../components/DateRangePicker";
import calculateNights from "../../utils/calculate-nights.js";
import { useState } from "react";

const House = ({ house }) => {
  const [dateChosen, setDateChosen] = useState(false);
  const [stayNights, setStayNights] = useState(0);
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
        <p>
          {house.rating} ({house.reviewsCount})
        </p>
      </article>
      <aside>
        <h2>Add dates for prices.</h2>
        <DateRangePicker
          datesChanged={(startDate, endDate) => {
            setDateChosen(true);
            setStayNights(calculateNights(startDate, endDate));
            console.log(startDate, endDate);
          }}
        />
        {dateChosen && (
          <div>
            <h2>Price per night</h2>
            <p>${house.price}</p>
            <h2>Total price for the booking</h2>
            <p>${(stayNights * house.price).toFixed(2)}</p>
            <button className="reserve">Reserve</button>
          </div>
        )}
      </aside>
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

House.getInitialProps = ({ query }) => {
  // our query is taken from the url
  const { id } = query; // houses/queryParameters. It is in the file name [id].js
  console.log(query);
  return {
    house: Houses.filter(house => house.id === id)[0]
  };
};

export default House;
