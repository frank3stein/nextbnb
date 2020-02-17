// import houses from "./houses.json";
import fetch from "isomorphic-unfetch";
import House from "../components/House";
import Layout from "../components/Layout.js";

const initialProps = async () => {
  const res = await fetch("http://localhost:3000/api/houses");
  const reviews = await fetch("http://localhost:3000/api/houses");
  const houses = await res.json();

  return {
    houses
  };
};

const Index = props => (
  <Layout
    content={
      <div>
        <h1>NextBnB</h1>
        <h2>Places to stay</h2>
        <div className="houses">
          {props.houses.map((house, index) => (
            <House {...house} key={index} />
          ))}
        </div>
        <style jsx>{`
          .houses {
            display: grid;
            grid-template-columns: 50% 50%;
            grid-template-rows: 300px 300px;
            grid-gap: 40px;
          }
        `}</style>
      </div>
    }
  ></Layout>
);

Index.getInitialProps = initialProps;

export default Index;
