import Link from "next/link";

const House = ({ id, picture, type, town, title, rating, reviewsCount }) => (
  <Link href="/houses/[id]" as={"/houses/" + id}>
    <a>
      <div>
        <img src={picture} alt="Picture of the house" width="100%" />
        <p>
          {type} - {town}
        </p>
        <p>{title}</p>
        <p>
          {rating} ({reviewsCount})
        </p>
      </div>
    </a>
  </Link>
);

export default House;
